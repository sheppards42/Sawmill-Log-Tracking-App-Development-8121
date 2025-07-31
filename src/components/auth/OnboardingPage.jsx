import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { OnBoarding } from '@questlabs/react-sdk';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSettings, FiCheckCircle, FiArrowRight, FiStar, FiTarget, FiZap } = FiIcons;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const [answers, setAnswers] = useState({});

  const getAnswers = () => {
    // Navigate to main app after completion
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Left Section - Visual/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-20 w-32 h-32 bg-white bg-opacity-10 rounded-full"
            animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-60 right-20 w-24 h-24 bg-white bg-opacity-10 rounded-full"
            animate={{ y: [0, 20, 0], rotate: [0, -180, -360] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-40 left-40 w-40 h-40 bg-white bg-opacity-5 rounded-full"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-8">
              <motion.div
                className="inline-flex items-center gap-3 p-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <SafeIcon icon={FiSettings} className="text-3xl text-white" />
                <span className="text-xl font-semibold">Setup in Progress</span>
              </motion.div>
            </div>

            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Let's Get You
              <span className="block text-indigo-200">Set Up!</span>
            </h1>

            <p className="text-xl text-indigo-100 mb-12 leading-relaxed">
              We're personalizing your sawmill management experience. 
              This quick setup will help us tailor the system to your specific needs.
            </p>

            <div className="space-y-6">
              <motion.div 
                className="flex items-center gap-4 p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="p-2 bg-green-400 bg-opacity-30 rounded-lg">
                  <SafeIcon icon={FiCheckCircle} className="text-xl text-green-200" />
                </div>
                <div>
                  <h3 className="font-semibold">Account Created</h3>
                  <p className="text-sm text-indigo-100">Your secure account is ready</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-center gap-4 p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="p-2 bg-yellow-400 bg-opacity-30 rounded-lg">
                  <SafeIcon icon={FiStar} className="text-xl text-yellow-200" />
                </div>
                <div>
                  <h3 className="font-semibold">Personalizing Experience</h3>
                  <p className="text-sm text-indigo-100">Customizing for your workflow</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-center gap-4 p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="p-2 bg-blue-400 bg-opacity-30 rounded-lg">
                  <SafeIcon icon={FiTarget} className="text-xl text-blue-200" />
                </div>
                <div>
                  <h3 className="font-semibold">Almost Ready</h3>
                  <p className="text-sm text-indigo-100">Final setup steps ahead</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="mt-12 p-6 bg-gradient-to-r from-white bg-opacity-10 to-transparent backdrop-blur-sm rounded-xl border border-white border-opacity-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <SafeIcon icon={FiZap} className="text-2xl text-yellow-300" />
                <h3 className="text-lg font-semibold">Quick Tip</h3>
              </div>
              <p className="text-indigo-100 text-sm leading-relaxed">
                Answer the setup questions honestly to get the most relevant features 
                and recommendations for your sawmill operation.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Section - Onboarding Component */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 p-4 bg-indigo-100 rounded-2xl mb-4">
              <SafeIcon icon={FiSettings} className="text-2xl text-indigo-600" />
              <span className="text-lg font-semibold text-indigo-800">Setup</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Let's Get Started!</h1>
            <p className="text-gray-600">We're setting things up for you.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <OnBoarding
                userId={userId}
                token={token}
                questId="c-greta-onboarding"
                answer={answers}
                setAnswer={setAnswers}
                getAnswers={getAnswers}
                singleChoose="modal1"
                multiChoice="modal2"
                styles={{
                  container: {
                    width: '100%',
                    maxWidth: '400px'
                  }
                }}
              >
                <OnBoarding.Header />
                <OnBoarding.Content />
                <OnBoarding.Footer />
              </OnBoarding>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
            <p className="text-sm text-gray-500">Step 1 of 3 - Almost done!</p>
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <SafeIcon icon={FiArrowRight} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-800">What's Next?</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              After setup, you'll have access to log entry, cutting station management, 
              plank tracking, and comprehensive reporting tools.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;