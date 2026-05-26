/**
 * Tipo para strings criptografadas
 */
export type Encrypted = string;

/**
 * Tipo para hash one-way
 */
export type Hashed = string;

/**
 * Configuração de campos a criptografar (simplificada)
 * Usa string[] para máxima flexibilidade entre diferentes tipos
 */
export interface CryptoConfig {
  readonly fields: ReadonlyArray<string>;
}