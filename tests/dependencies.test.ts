import assert from "node:assert/strict";
import {
  constants,
  generateKeyPairSync,
  privateEncrypt,
  sign,
} from "node:crypto";
import { createRequire } from "node:module";
import { test } from "node:test";

test("the packaging signature dependency rejects extra DigestAlgorithm elements", () => {
  const forge = createRequire(import.meta.resolve("@anthropic-ai/mcpb"))(
    "node-forge",
  );
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 1024,
    publicExponent: 3,
    publicKeyEncoding: { type: "pkcs1", format: "pem" },
    privateKeyEncoding: { type: "pkcs1", format: "pem" },
  });
  const message = "Synthetic signature check";
  const digest = forge.md.sha256.create().update(message).digest().getBytes();
  const verifier = forge.pki.publicKeyFromPem(publicKey);
  assert.equal(
    verifier.verify(
      digest,
      sign("sha256", Buffer.from(message), privateKey).toString("binary"),
    ),
    true,
  );
  const { asn1 } = forge;
  const malformed = asn1.create(
    asn1.Class.UNIVERSAL,
    asn1.Type.SEQUENCE,
    true,
    [
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OID,
          false,
          asn1.oidToDer(forge.pki.oids.sha256).getBytes(),
        ),
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, ""),
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OCTETSTRING,
          false,
          "unexpected",
        ),
      ]),
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, digest),
    ],
  );
  const signature = privateEncrypt(
    { key: privateKey, padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(asn1.toDer(malformed).getBytes(), "binary"),
  );
  assert.throws(
    () => verifier.verify(digest, signature.toString("binary")),
    /valid RSASSA-PKCS1-v1_5 DigestInfo/,
  );
});
