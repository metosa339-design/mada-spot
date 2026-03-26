// Schémas de validation Zod pour l'authentification
import { z } from 'zod';

// Regex pour le téléphone malgache
// Formats acceptés: +261 XX XX XXX XX, 0XX XX XXX XX, 020 XX XXX XX
// Préfixes mobiles: 032, 033, 034, 038 — Fixes: 020, 022
const phoneRegexMG = /^(\+261|0)(20|22|32|33|34|38)[0-9]{7}$/;

// Regex internationale : +indicatif suivi de 4 à 15 chiffres
const phoneRegexIntl = /^\+[1-9]\d{0,3}\s?\d{4,14}$/;

/**
 * Schéma de connexion (email ou téléphone)
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email ou téléphone requis')
    .refine(
      (val) => {
        // Soit un email valide, soit un téléphone malgache
        const isEmail = z.string().email().safeParse(val).success;
        const cleanVal = val.replace(/\s/g, '');
        const isPhone = phoneRegexMG.test(cleanVal) || phoneRegexIntl.test(val.replace(/\s{2,}/g, ' ').trim());
        return isEmail || isPhone;
      },
      { message: 'Email ou numéro de téléphone invalide' }
    ),
  password: z.string().min(1, 'Mot de passe requis'),
});

/**
 * Schéma de base d'inscription (sans refinements pour permettre l'extension)
 */
const registerBaseSchema = z.object({
  // Informations de connexion
  email: z
    .string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string(),

  // Informations personnelles
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),

  // Type de compte
  role: z.enum(['CLIENT'], {
    message: 'Type de compte invalide',
  }),

  // Type d'établissement (pro uniquement, défini à l'inscription)
  userType: z.enum(['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER']).optional(),

  // Conditions d'utilisation
  acceptTerms: z.boolean(),
});

// Fonction helper pour ajouter les refinements communs
const addRegisterRefinements = <T extends z.ZodTypeAny>(schema: T) => {
  return schema
    .refine((data: any) => data.acceptTerms === true, {
      message: 'Vous devez accepter les conditions d\'utilisation',
      path: ['acceptTerms'],
    })
    .refine((data: any) => data.email || data.phone, {
      message: 'Vous devez fournir un email ou un numéro de téléphone',
      path: ['email'],
    })
    .refine((data: any) => {
      if (data.phone) {
        const cleanPhone = data.phone.replace(/\s/g, '');
        if (!cleanPhone) return true;
        // Accepter les numéros malgaches OU internationaux
        return phoneRegexMG.test(cleanPhone) || phoneRegexIntl.test(data.phone.replace(/\s{2,}/g, ' ').trim());
      }
      return true;
    }, {
      message: 'Numéro de téléphone invalide',
      path: ['phone'],
    })
    .refine((data: any) => data.password === data.confirmPassword, {
      message: 'Les mots de passe ne correspondent pas',
      path: ['confirmPassword'],
    });
};

/**
 * Schéma d'inscription
 */
export const registerSchema = addRegisterRefinements(registerBaseSchema);

/**
 * Schéma pour l'inscription client
 */
export const registerClientSchema = addRegisterRefinements(
  registerBaseSchema.extend({
    role: z.literal('CLIENT'),
    // Infos client optionnelles
    companyName: z.string().max(100).optional(),
    city: z.string().max(50).optional(),
  })
);

/**
 * Schéma pour la demande de réinitialisation de mot de passe
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

/**
 * Schéma pour la réinitialisation de mot de passe
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token requis'),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

/**
 * Schéma pour la mise à jour du mot de passe
 */
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z
      .string()
      .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

// Types inférés
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterClientInput = z.infer<typeof registerClientSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
