import * as fs from 'fs';
import * as path from 'path';

const { md, pki } = require('node-forge');

import { logger } from '../utils/logger';

let certPem: string;
let keyPem: string;

export const tlsSites = ['ffrk.denagames.com'];

export function createOrLoadCertificate(userDataPath: string) {
  const certFilename = path.join(userDataPath, 'ffrk-cert.pem');
  const keyFilename = path.join(userDataPath, 'ffrk-key.pem');

  // FIXME: Show message on error
  if (fs.existsSync(certFilename) && fs.existsSync(keyFilename)) {
    try {
      certPem = fs.readFileSync(certFilename).toString();
      keyPem = fs.readFileSync(keyFilename).toString();
      return;
    } catch (e) {
      logger.error('Failed to load certificates');
      logger.error(e);
    }
  }

  [certPem, keyPem] = createCertificate();

  try {
    fs.writeFileSync(certFilename, certPem);
    fs.writeFileSync(keyFilename, keyPem);
  } catch (e) {
    logger.error('Failed to load certificates');
    logger.error(e);
  }
}

/**
 * Generates a certificate and returns the PEM-encoded certificate and key.
 * Based on https://github.com/digitalbazaar/forge#x509
 */
function createCertificate(): [string, string] {
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();

  cert.publicKey = keys.publicKey;

  // NOTE: serialNumber is the hex encoded value of an ASN.1 INTEGER.
  // Conforming CAs should ensure serialNumber is:
  // - no more than 20 octets
  // - non-negative (prefix a '00' if your value starts with a '1' bit)
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 5);

  const attrs = [
    {
      name: 'commonName',
      value: tlsSites[0],
    },
    {
      name: 'countryName',
      value: 'US'
    },
    {
      name: 'organizationName',
      value: 'RK Squared'
    }
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    },
    {
      name: 'nsCertType',
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true
    },
    {
      name: 'subjectAltName',
      altNames: [
        ...tlsSites.map(site => ({
          type: 2, // DNS - see https://tools.ietf.org/html/rfc5280#section-4.2.1.6
          value: site
        })),
        // {
        //   type: 7, // IP
        //   ip: '127.0.0.1'
        // }
      ]
    },
    {
      name: 'subjectKeyIdentifier'
    }
  ]);
  cert.sign(keys.privateKey, md.sha256.create());

  return [
    pki.certificateToPem(cert),
    pki.privateKeyToPem(keys.privateKey)
  ];
}

export function getCertificate() {
  return [certPem, keyPem];
}
