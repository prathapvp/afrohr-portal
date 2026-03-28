package com.jobportal.security;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

@Component
public class PiiCryptoService {

    private static final String AES = "AES";
    private static final String AES_GCM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;
    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public PiiCryptoService(@Value("${app.pii.secret:change-me-pii-secret}") String secret) {
        byte[] keyBytes = normalizeKey(secret);
        this.secretKey = new SecretKeySpec(keyBytes, AES);
    }

    public String encryptString(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            return plaintext;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);
            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to encrypt PII", ex);
        }
    }

    public String decryptString(String encodedCiphertext) {
        if (encodedCiphertext == null || encodedCiphertext.isBlank()) {
            return encodedCiphertext;
        }
        try {
            byte[] data = Base64.getDecoder().decode(encodedCiphertext);
            ByteBuffer buffer = ByteBuffer.wrap(data);
            byte[] iv = new byte[IV_LENGTH];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to decrypt PII", ex);
        }
    }

    private byte[] normalizeKey(String secret) {
        byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
        byte[] key = new byte[32];
        for (int i = 0; i < key.length; i++) {
            key[i] = i < raw.length ? raw[i] : 0;
        }
        return key;
    }
}
