import * as fs from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import * as moment from 'moment';
import { md, pki } from 'node-forge';

import { logException, logger } from '../utils/logger';

export const tlsSites = ['ffrk.denagames.com', 'dff.sp.mbga.jp'];

export interface TlsCert {
  key: string;
  cert: string;
  ca: string;
}

function setCommon(cert: pki.Certificate, commonName: string, issuer?: pki.Certificate) {
  // NOTE: serialNumber is the hex encoded value of an ASN.1 INTEGER.
  // Conforming CAs should ensure serialNumber is:
  // - no more than 20 octets
  // - non-negative (prefix a '00' if your value starts with a '1' bit)
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  // As described at https://support.apple.com/en-gb/HT210176, certificates
  // must be valid for 825 days or less.
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 2);

  const attrs = [
    {
      name: 'commonName',
      value: commonName,
    },
    {
      name: 'countryName',
      value: 'US',
    },
    {
      name: 'organizationName',
      value: 'RK Squared',
    },
  ];
  cert.setSubject(attrs);
  if (issuer) {
    cert.setIssuer(issuer.subject.attributes);
  } else {
    cert.setIssuer(attrs);
  }
}

function certFilenames(userDataPath: string) {
  return {
    ca: path.join(userDataPath, 'ffrk-ca.pem'),
    cert: path.join(userDataPath, 'ffrk-cert.pem'),
    key: path.join(userDataPath, 'ffrk-key.pem'),
  };
}

export function createOrLoadCertificate(
  userDataPath: string,
  errorCallback?: (error: string) => void,
): TlsCert {
  const filenames = certFilenames(userDataPath);

  const filesExist =
    +fs.existsSync(filenames.ca) + +fs.existsSync(filenames.cert) + +fs.existsSync(filenames.key);
  if (filesExist === 3) {
    try {
      const loadCert = {
        ca: fs.readFileSync(filenames.ca).toString(),
        cert: fs.readFileSync(filenames.cert).toString(),
        key: fs.readFileSync(filenames.key).toString(),
      };
      return loadCert;
    } catch (e) {
      logger.error('Failed to load certificates');
      logException(e);
      errorCallback && errorCallback('Failed to load certificates: ' + e.message);
    }
  } else if (filesExist) {
    logger.error(`Unexpected certificates: only ${filesExist} are present`);
    errorCallback && errorCallback(`Unexpected certificates: only ${filesExist} are present`);
  }

  const [caCert, caKey] = createCaCertificate('RK Squared');
  const [siteCert, siteKey] = createSiteCertificate(caCert, caKey, tlsSites);
  const tlsCert = {
    ca: pki.certificateToPem(caCert),
    cert: pki.certificateToPem(siteCert),
    key: pki.privateKeyToPem(siteKey.privateKey),
  };

  try {
    fs.writeFileSync(filenames.ca, tlsCert.ca);
    fs.writeFileSync(filenames.cert, tlsCert.cert);
    fs.writeFileSync(filenames.key, tlsCert.key);
  } catch (e) {
    logger.error('Failed to save certificates');
    logException(e);
    errorCallback && errorCallback('Failed to save certificates: ' + e.message);
  }
  return tlsCert;
}

/**
 * Generates a certificate and returns the PEM-encoded certificate and key.
 * Based on https://github.com/digitalbazaar/forge#x509
 */
function createCaCertificate(caName: string): [pki.Certificate, pki.KeyPair] {
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();

  cert.publicKey = keys.publicKey;

  setCommon(cert, caName);
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true,
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: false,
      codeSigning: false,
      emailProtection: false,
      timeStamping: true,
    },
    {
      name: 'nsCertType',
      client: false,
      server: true,
      email: false,
      objsign: false,
      sslCA: true,
      emailCA: false,
      objCA: false,
    },
    {
      name: 'subjectKeyIdentifier',
    },
  ]);
  cert.sign(keys.privateKey, md.sha256.create());

  return [cert, keys];
}

/**
 * Generates a certificate and returns the PEM-encoded certificate and key.
 * Based on https://github.com/digitalbazaar/forge#x509
 */
function createSiteCertificate(
  caCert: pki.Certificate,
  caKey: pki.KeyPair,
  sites: string[],
): [pki.Certificate, pki.KeyPair] {
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();

  cert.publicKey = keys.publicKey;

  setCommon(cert, sites[0], caCert);
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: false,
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: false,
      codeSigning: false,
      emailProtection: false,
      timeStamping: true,
    },
    {
      name: 'nsCertType',
      client: false,
      server: true,
      email: false,
      objsign: false,
      sslCA: false,
      emailCA: false,
      objCA: false,
    },
    {
      name: 'subjectAltName',
      altNames: [
        ...tlsSites.map(site => ({
          type: 2, // DNS - see https://tools.ietf.org/html/rfc5280#section-4.2.1.6
          value: site,
        })),
        // {
        //   type: 7, // IP
        //   ip: '127.0.0.1'
        // }
      ],
    },
    {
      name: 'subjectKeyIdentifier',
    },
  ]);
  cert.sign(caKey.privateKey, md.sha256.create());

  return [cert, keys];
}

export function checkCertificate(cert: string | TlsCert): string[] {
  // https://support.apple.com/en-gb/HT210176
  const iosMaxValidDays = 825;
  const iosDateRestrictions = new Date(2019, 6, 1); // July 1, 2019

  if (typeof cert !== 'string') {
    return _.uniq([...checkCertificate(cert.ca), ...checkCertificate(cert.cert)]);
  }

  let pkiCert: pki.Certificate;
  try {
    pkiCert = pki.certificateFromPem(cert);
  } catch (e) {
    return [`Unable to process certificate: ${e.message}`];
  }

  const problems: string[] = [];

  const { notBefore, notAfter } = pkiCert.validity;
  const daysBetween = moment(notAfter).diff(notBefore, 'days');
  if (daysBetween > iosMaxValidDays && notBefore > iosDateRestrictions) {
    problems.push(`RK²'s certificate is not valid on iOS 13.`);
  }
  if (notAfter < new Date()) {
    problems.push(`RK²'s certificate has expired.`);
  }

  return problems;
}

export function deleteCertificate(userDataPath: string, errorCallback?: (error: string) => void) {
  const filenames = certFilenames(userDataPath);
  try {
    fs.unlinkSync(filenames.ca);
    fs.unlinkSync(filenames.cert);
    fs.unlinkSync(filenames.key);
  } catch (e) {
    logger.error('Failed to delete certificate');
    logException(e);
    errorCallback && errorCallback('Failed to delete certificate: ' + e.message);
  }
}
