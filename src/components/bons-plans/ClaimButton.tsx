'use client';

import { useState } from 'react';
import { Flag, X, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClaimButtonProps {
  establishmentId: string;
  establishmentName: string;
  isClaimed?: boolean;
}

export default function ClaimButton({ establishmentId, establishmentName, isClaimed }: ClaimButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    claimantName: '',
    claimantEmail: '',
    claimantPhone: '',
    claimantRole: 'owner',
    proofDescription: '',
  });

  if (isClaimed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/bons-plans/establishments/${establishmentId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#ff6b35] transition-colors"
      >
        <Flag className="w-4 h-4" />
        Revendiquer cette fiche
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => !isSubmitting && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a24] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {submitted ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Demande envoyée</h3>
                  <p className="text-slate-600 mb-6">
                    Votre demande de revendication pour "{establishmentName}" a été soumise.
                    Notre équipe l'examinera dans les 48h.
                  </p>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Revendiquer cette fiche</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{establishmentName}</p>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Votre nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.claimantName}
                        onChange={(e) => setForm({ ...form, claimantName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] outline-none"
                        placeholder="Jean Rakoto"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Adresse email *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.claimantEmail}
                        onChange={(e) => setForm({ ...form, claimantEmail: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] outline-none"
                        placeholder="jean@exemple.mg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={form.claimantPhone}
                        onChange={(e) => setForm({ ...form, claimantPhone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] outline-none"
                        placeholder="+261 34 00 000 00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Votre rôle *
                      </label>
                      <select
                        value={form.claimantRole}
                        onChange={(e) => setForm({ ...form, claimantRole: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] outline-none"
                      >
                        <option value="owner">Propriétaire</option>
                        <option value="manager">Gérant</option>
                        <option value="employee">Employé</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Comment prouver que vous êtes le responsable ?
                      </label>
                      <textarea
                        value={form.proofDescription}
                        onChange={(e) => setForm({ ...form, proofDescription: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35] outline-none resize-none"
                        placeholder="Ex: Je suis le propriétaire depuis 2015, je peux fournir le NIF/STAT de l'entreprise..."
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-gradient-to-r from-[#ff6b35] to-[#ff1493] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Flag className="w-4 h-4" />
                          Envoyer la demande
                        </>
                      )}
                    </button>

                    <p className="text-xs text-slate-400 text-center">
                      Notre équipe vérifiera votre identité avant d'approuver la revendication.
                    </p>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
