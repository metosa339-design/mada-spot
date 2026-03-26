'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Building2 } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
}

export default function JobsSection() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs?limit=6');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <section className="py-8 border-t border-[#2a2a36]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Offres d'Emploi</h2>
          <p className="text-sm text-gray-500">{jobs.length} offre{jobs.length > 1 ? 's' : ''} disponible{jobs.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Jobs Grid - Simple cards with image */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {jobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#1a1a24] border border-[#2a2a36] rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all group"
          >
            {/* Image */}
            <div className="relative aspect-square bg-white/5 flex items-center justify-center overflow-hidden">
              {job.companyLogo ? (
                <Image src={getImageUrl(job.companyLogo)} alt={job.company} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" className="object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <Building2 className="w-12 h-12 text-gray-300" />
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="font-semibold text-white text-sm truncate group-hover:text-blue-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-xs text-gray-500 truncate">{job.company}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
