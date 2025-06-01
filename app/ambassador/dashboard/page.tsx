'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function AmbassadorDashboard() {
  const [productLink, setProductLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);

  useEffect(() => {
    fetchAmbassadorData();
  }, []);

  const fetchAmbassadorData = async () => {
    try {
      const response = await axios.get('/api/ambassador/profile');
      setAmbassadorData(response.data);
    } catch (error) {
      console.error('Error fetching ambassador data:', error);
      toast.error('Failed to load ambassador data');
    }
  };

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/ambassadors/update-video-link', {
        email: ambassadorData?.email,
        productVideoLink: productLink
      });

      if (response.data.success) {
        toast.success('Link submitted successfully!');
        setProductLink('');
        // Refresh ambassador data to show updated status
        fetchAmbassadorData();
      }
    } catch (error: any) {
      console.error('Error submitting link:', error);
      toast.error(error.response?.data?.error || 'Failed to submit link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Ambassador Dashboard</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Welcome {ambassadorData?.name}</h2>
        <p className="text-gray-600 mb-4">
          Thank you for being part of our ambassador program. You can use this dashboard to track your referrals and earnings.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Product Link</h3>
        <p className="text-gray-600 mb-4">
          Share a link to your content showcasing our products. This helps us promote your content and track your influence.
        </p>

        <form onSubmit={handleSubmitLink} className="space-y-4">
          <div>
            <label htmlFor="productLink" className="block text-sm font-medium text-gray-700">
              Link to your content
            </label>
            <input
              type="url"
              id="productLink"
              value={productLink}
              onChange={(e) => setProductLink(e.target.value)}
              placeholder="https://example.com/your-content"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Link'}
          </button>

          {ambassadorData?.productVideoLink && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Current link: <a href={ambassadorData.productVideoLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">{ambassadorData.productVideoLink}</a>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 