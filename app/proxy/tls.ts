import * as fs from 'fs';
import * as path from 'path';

import { md, pki } from 'node-forge';

import { logger } from '../utils/logger';

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

export function createOrLoadCertificate(
  userDataPath: string,
  errorCallback?: (error: string) => void,
): TlsCert {
  const tlsCert = {
    key: '',
    cert: '',
    ca: '',
  };

  const caFilename = path.join(userDataPath, 'ffrk-ca.pem');
  const certFilename = path.join(userDataPath, 'ffrk-cert.pem');
  const keyFilename = path.join(userDataPath, 'ffrk-key.pem');

  const filesExist =
    +fs.existsSync(caFilename) + +fs.existsSync(certFilename) + +fs.existsSync(keyFilename);
  if (filesExist === 3) {
    try {
      tlsCert.ca = fs.readFileSync(caFilename).toString();
      tlsCert.cert = fs.readFileSync(certFilename).toString();
      tlsCert.key = fs.readFileSync(keyFilename).toString();
      return tlsCert;
    } catch (e) {
      logger.error('Failed to load certificates');
      logger.error(e);
      errorCallback && errorCallback('Failed to load certificates: ' + e.message);
    }
  } else if (filesExist) {
    logger.error(`Unexpected certificates: only ${filesExist} are present`);
    errorCallback && errorCallback(`Unexpected certificates: only ${filesExist} are present`);
  }

  const [caCert, caKey] = createCaCertificate('RK Squared');
  const [siteCert, siteKey] = createSiteCertificate(caCert, caKey, tlsSites);
  tlsCert.ca = pki.certificateToPem(caCert);
  tlsCert.cert = pki.certificateToPem(siteCert);
  tlsCert.key = pki.privateKeyToPem(siteKey.privateKey);

  try {
    fs.writeFileSync(caFilename, tlsCert.ca);
    fs.writeFileSync(certFilename, tlsCert.cert);
    fs.writeFileSync(keyFilename, tlsCert.key);
  } catch (e) {
    logger.error('Failed to save certificates');
    logger.error(e);
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
