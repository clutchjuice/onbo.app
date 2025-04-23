'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { submitOnboarding, type OnboardingData } from '../actions'

const ProgressBar = ({ currentStep, isSubmitting }: { currentStep: number; isSubmitting: boolean }) => {
  // Calculate progress as percentage
  // Step 1 (role): 0%
  // Steps 2-5: 25%, 50%, 75%, 100%
  const progress = currentStep === 0 || currentStep === 1 ? 0 : 
                  isSubmitting ? 100 : 
                  ((currentStep - 1) / 4) * 100

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-blue-600 transition-all duration-700 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

const TeamNameInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement
      onChange(target.value)
    }

    input.value = value
    input.addEventListener('input', handleInput)
    
    return () => {
      input.removeEventListener('input', handleInput)
    }
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      id="teamName"
      placeholder="Type here"
      className="mt-2 w-full text-lg py-6 px-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      autoComplete="off"
    />
  )
}

export default function OnboardingForm() {
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [welcomeStep, setWelcomeStep] = useState<number | null>(null)
  const [showContent, setShowContent] = useState(false)
  const [showSetupAnimation, setShowSetupAnimation] = useState(false)
  const [setupStep, setSetupStep] = useState<number | null>(null)
  const [formData, setFormData] = useState<OnboardingData>({
    niche: '',
    customNiche: '',
    referral_source: '',
    customReferralSource: '',
    organization_name: '',
    organization_size: '',
    use_case: []
  })
  const [formVisible, setFormVisible] = useState(true)
  const router = useRouter()
  const workspaceId = 'your-workspace-id' // Replace with actual workspace ID

  useEffect(() => {
    if (step === 0) {
      setShowContent(false)
      setWelcomeStep(null)
      setSetupStep(null)
      setShowSetupAnimation(false)
      
      // Delay showing any content initially
      const initialDelay = setTimeout(() => setShowContent(true), 400)
      
      // Welcome animation sequence with fade outs
      const timers = [
        // First message
        setTimeout(() => setWelcomeStep(1), 500),
        setTimeout(() => setWelcomeStep(-1), 2500), // Fade out
        
        // Second message
        setTimeout(() => setWelcomeStep(2), 3000),
        setTimeout(() => setWelcomeStep(-2), 5000), // Fade out
        
        // Third message
        setTimeout(() => setWelcomeStep(3), 5500),
        setTimeout(() => setWelcomeStep(-3), 7500), // Fade out
        
        // Move to first question
        setTimeout(() => {
          setIsAnimating(true)
          setTimeout(() => {
            setStep(1)
            setIsAnimating(false)
          }, 300)
        }, 8000)
      ]

      return () => {
        clearTimeout(initialDelay)
        timers.forEach(timer => clearTimeout(timer))
      }
    }

    // Setup text animation between steps 2 and 3
    if (step === 2.5) {
      setSetupStep(null)
      setShowContent(true)
      
      const timers = [
        setTimeout(() => setSetupStep(1), 500),
        setTimeout(() => setSetupStep(-1), 2500),
        setTimeout(() => {
          setIsAnimating(true)
          setTimeout(() => {
            setStep(3)
            setIsAnimating(false)
          }, 300)
        }, 3000)
      ]

      return () => timers.forEach(timer => clearTimeout(timer))
    }
  }, [step])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleTeamNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, teamName: value }))
  }

  const handleNext = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    // Validate current step
    if (step === 1) {
      if (!formData.niche) {
        toast.error("Please select your work type")
        return
      }
      if (formData.niche === 'other' && !formData.customNiche) {
        toast.error("Please specify your work type")
        return
      }
      setFormVisible(false)
      setTimeout(() => {
        setStep(prev => prev + 1)
        setFormVisible(true)
      }, 300)
      return
    }

    if (step === 2) {
      if (!formData.referral_source) {
        toast.error("Please select how you found us")
        return
      }
      if (formData.referral_source === 'other' && !formData.customReferralSource) {
        toast.error("Please specify how you found us")
        return
      }
      
      // First fade out the form
      setFormVisible(false)
      
      // Wait for fade out to complete before starting animation
      setTimeout(() => {
        // Move to next step immediately after fade out
        setStep(prev => prev + 1)
        
        // Start setup animation
        setShowSetupAnimation(true)
        setSetupStep(null)
        
        const timers = [
          setTimeout(() => setSetupStep(1), 200),
          setTimeout(() => setSetupStep(-1), 2200),
          setTimeout(() => {
            setShowSetupAnimation(false)
            setFormVisible(true)
          }, 2700)
        ]

        return () => timers.forEach(timer => clearTimeout(timer))
      }, 400)
      return
    }

    if (step === 3) {
      if (!formData.organization_name) {
        toast.error("Please enter your team name")
        return
      }
      if (!formData.organization_size) {
        toast.error("Please select your team size")
        return
      }
      setFormVisible(false)
      setTimeout(() => {
        setStep(prev => prev + 1)
        setFormVisible(true)
      }, 300)
      return
    }

    // For the final step
    if (step === 4) {
      if (formData.use_case.length === 0) {
        toast.error("Please select at least one use case")
        return
      }
      setFormVisible(false)
      // Increment step to show progress bar completion
      setStep(prev => prev + 1)
      // Submit the form
      handleSubmit()
      return
    }
  }

  const handleBack = () => {
    setFormVisible(false)
    setTimeout(() => {
      setStep(prev => prev - 1)
      setFormVisible(true)
    }, 300)
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      const result = await submitOnboarding(formData)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("Welcome to Onbo!")
      router.push('/dashboard')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <style jsx>{`
        .steps-container {
          position: relative;
          min-height: 500px;
          overflow: hidden;
        }
        
        .step-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease;
          visibility: hidden;
          pointer-events: none;
        }
        
        .step-content.active {
          opacity: 1;
          transform: translateY(0);
          position: relative;
          visibility: visible;
          pointer-events: all;
        }
        
        .step-content.prev {
          opacity: 0;
          transform: translateY(-20px);
          visibility: hidden;
          pointer-events: none;
          position: absolute;
        }
        
        .step-content.next {
          opacity: 0;
          transform: translateY(20px);
          visibility: hidden;
          pointer-events: none;
          position: absolute;
        }

        .welcome-container {
          text-align: center;
          position: relative;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          width: 100%;
          padding: 0 20px;
        }

        .welcome-container.visible {
          opacity: 1;
        }

        .welcome-text {
          position: absolute;
          font-size: 12rem;
          font-weight: 800;
          text-align: center;
          max-width: 1200px;
          pointer-events: none;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          line-height: 1;
        }

        .welcome-text.subtitle {
          font-size: 7rem;
          font-weight: 600;
          color: #666;
        }

        .welcome-text.small {
          font-size: 5rem;
          font-weight: 600;
        }

        .first-question {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease;
        }

        .first-question.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>

      {showContent && <ProgressBar currentStep={step} isSubmitting={isSubmitting} />}
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto relative">
          {showSetupAnimation && (
            <div className="fixed inset-0 top-1 bg-white z-40 flex items-center justify-center">
              {(setupStep === 1 || setupStep === -1) && (
                <motion.div 
                  className="welcome-text subtitle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: setupStep === 1 ? 1 : 0, y: setupStep === 1 ? 0 : -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ 
                    position: 'absolute',
                    fontSize: '2rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '100%',
                    lineHeight: 1.2,
                    left: 0,
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    margin: '0 auto',
                    color: '#666'
                  }}
                >
                  Now let's get your workspace set up
                </motion.div>
              )}
            </div>
          )}
          {step === 0 ? (
            <div className={`welcome-container ${showContent ? 'visible' : ''}`}>
              {(welcomeStep === 1 || welcomeStep === -1) && (
                <motion.div 
                  className="welcome-text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: welcomeStep === 1 ? 1 : 0, y: welcomeStep === 1 ? 0 : -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ 
                    position: 'absolute',
                    fontSize: '3.5rem',
                    fontWeight: 400,
                    textAlign: 'center',
                    width: '100%',
                    lineHeight: 1,
                    left: 0,
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    margin: '0 auto',
                    color: '#333'
                  }}
                >
                  Welcome to Onbo
                </motion.div>
              )}
              {(welcomeStep === 2 || welcomeStep === -2) && (
                <motion.div 
                  className="welcome-text subtitle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: welcomeStep === 2 ? 1 : 0, y: welcomeStep === 2 ? 0 : -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ 
                    position: 'absolute',
                    fontSize: '2rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '100%',
                    lineHeight: 1.2,
                    left: 0,
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    margin: '0 auto',
                    color: '#666'
                  }}
                >
                  You're moments away from creating magical onboarding experiences
                </motion.div>
              )}
              {(welcomeStep === 3 || welcomeStep === -3) && (
                <motion.div 
                  className="welcome-text small"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: welcomeStep === 3 ? 1 : 0, y: welcomeStep === 3 ? 0 : -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ 
                    position: 'absolute',
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '100%',
                    lineHeight: 1,
                    left: 0,
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    margin: '0 auto',
                    color: '#333'
                  }}
                >
                  First, tell us about you
                </motion.div>
              )}
            </div>
          ) : step === 2.5 ? (
            <div className={`welcome-container ${showContent ? 'visible' : ''}`}>
              {(setupStep === 1 || setupStep === -1) && (
                <motion.div 
                  className="welcome-text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: setupStep === 1 ? 1 : 0, y: setupStep === 1 ? 0 : -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ 
                    position: 'absolute',
                    fontSize: '3.5rem',
                    fontWeight: 400,
                    textAlign: 'center',
                    width: '100%',
                    lineHeight: 1,
                    left: 0,
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    margin: '0 auto',
                    color: '#333'
                  }}
                >
                  Now let's get your workspace set up
                </motion.div>
              )}
            </div>
          ) : (
            <form 
              onSubmit={handleNext}
              className={`transition-all duration-300 ${
                !formVisible ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              <div className="steps-container">
                {/* Step 1 */}
                <div 
                  className={`step-content ${
                    step === 1 ? 'active' : step < 1 ? 'next' : 'prev'
                  }`}
                  aria-hidden={step !== 1}
                >
                  <div className="space-y-6">
                    <div className="opacity-0 transform translate-y-4 animate-fade-in">
                      <h1 className="text-2xl font-semibold text-gray-900">What type of work do you do?</h1>
                      <p className="text-gray-500 mt-2">Select the option that best describes you</p>
                    </div>

                    <div className="mt-8 opacity-0 transform translate-y-4 animate-fade-in animation-delay-200">
                      <RadioGroup
                        value={formData.niche}
                        onValueChange={(value) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            niche: value,
                            customNiche: value !== 'other' ? '' : prev.customNiche 
                          }))
                        }}
                        className="space-y-4"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="agency" id="agency" className="h-5 w-5" />
                          <Label htmlFor="agency" className="text-base">I run an Agency</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="coach" id="coach" className="h-5 w-5" />
                          <Label htmlFor="coach" className="text-base">I'm a Coach or Consultant</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="saas" id="saas" className="h-5 w-5" />
                          <Label htmlFor="saas" className="text-base">I run a SaaS Business</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="hr" id="hr" className="h-5 w-5" />
                          <Label htmlFor="hr" className="text-base">I'm in HR or People Ops</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="freelancer" id="freelancer" className="h-5 w-5" />
                          <Label htmlFor="freelancer" className="text-base">I'm a Freelancer</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="other" id="other" className="h-5 w-5" />
                          <Label htmlFor="other" className="text-base">Other</Label>
                        </div>
                      </RadioGroup>

                      {formData.niche === 'other' && (
                        <div className="mt-4">
                          <Input
                            id="customNiche"
                            placeholder="Please specify"
                            className="w-full text-lg py-6 px-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.customNiche}
                            onChange={(e) => setFormData(prev => ({ ...prev, customNiche: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div 
                  className={`step-content ${
                    step === 2 ? 'active' : step < 2 ? 'next' : 'prev'
                  }`}
                  aria-hidden={step !== 2}
                >
                  <div className="space-y-6">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    
                    <div className="opacity-0 transform translate-y-4 animate-fade-in">
                      <h1 className="text-2xl font-semibold text-gray-900">How did you hear about us?</h1>
                      <p className="text-gray-500 mt-2">We'd love to know how you discovered Onbo</p>
                    </div>

                    <div className="mt-8 mb-8 opacity-0 transform translate-y-4 animate-fade-in animation-delay-200">
                      <RadioGroup
                        value={formData.referral_source}
                        onValueChange={(value) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            referral_source: value,
                            customReferralSource: value !== 'other' ? '' : prev.customReferralSource 
                          }))
                        }}
                        className="space-y-4"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="google" id="google" className="h-5 w-5" />
                          <Label htmlFor="google" className="text-base">Google search</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="social" id="social" className="h-5 w-5" />
                          <Label htmlFor="social" className="text-base">Social Media (Instagram, Twitter, X, LinkedIn, Reddit, YouTube, TikTok)</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="producthunt" id="producthunt" className="h-5 w-5" />
                          <Label htmlFor="producthunt" className="text-base">Product Hunt</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="friend" id="friend" className="h-5 w-5" />
                          <Label htmlFor="friend" className="text-base">From a friend or colleague</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="ad" id="ad" className="h-5 w-5" />
                          <Label htmlFor="ad" className="text-base">I saw your ad</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="other" id="other-source" className="h-5 w-5" />
                          <Label htmlFor="other-source" className="text-base">Other</Label>
                        </div>
                      </RadioGroup>

                      {formData.referral_source === 'other' && (
                        <div className="mt-6">
                          <Input
                            id="customReferralSource"
                            placeholder="Please specify"
                            className="w-full text-lg py-6 px-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.customReferralSource}
                            onChange={(e) => setFormData(prev => ({ ...prev, customReferralSource: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div 
                  className={`step-content ${
                    step === 3 ? 'active' : step < 3 ? 'next' : 'prev'
                  }`}
                  aria-hidden={step !== 3}
                >
                  <div className="space-y-6">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    
                    <div>
                      <h1 className="text-2xl font-semibold text-gray-900">Team or Business Info</h1>
                      <p className="text-gray-500 mt-2">Set up your organization</p>
                    </div>

                    <div className="mt-8 space-y-8">
                      <div>
                        <Label htmlFor="organization_name" className="text-base">What's the name of your team, company, or agency?</Label>
                        <Input
                          id="organization_name"
                          placeholder="Type here"
                          className="mt-2 w-full text-lg py-6 px-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.organization_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, organization_name: e.target.value }))}
                          autoComplete="off"
                        />
                      </div>

                      <div>
                        <Label className="text-base">How many people are on your team?</Label>
                        <RadioGroup
                          value={formData.organization_size}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, organization_size: value }))}
                          className="mt-4 space-y-4"
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="solo" id="solo" className="h-5 w-5" />
                            <Label htmlFor="solo" className="text-base">Just me</Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="small" id="small" className="h-5 w-5" />
                            <Label htmlFor="small" className="text-base">2–5</Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="medium" id="medium" className="h-5 w-5" />
                            <Label htmlFor="medium" className="text-base">6–20</Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="large" id="large" className="h-5 w-5" />
                            <Label htmlFor="large" className="text-base">20+</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div 
                  className={`step-content ${
                    step === 4 ? 'active' : step < 4 ? 'next' : 'prev'
                  }`}
                  aria-hidden={step !== 4}
                >
                  <div className="space-y-6">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    
                    <div>
                      <h1 className="text-2xl font-semibold text-gray-900">What Will You Use This For?</h1>
                      <p className="text-gray-500 mt-2">What do you want to create first?</p>
                    </div>

                    <div className="mt-8 space-y-4">
                      {[
                        { id: 'client', label: 'Client onboarding' },
                        { id: 'employee', label: 'New employee onboarding' },
                        { id: 'course', label: 'Course or coaching program onboarding' },
                        { id: 'freelancer', label: 'Freelancer or contractor onboarding' }
                      ].map(({ id, label }) => (
                        <div key={id} className="flex items-center space-x-3">
                          <Checkbox
                            id={id}
                            checked={formData.use_case.includes(id)}
                            onCheckedChange={(checked) => {
                              const newUseCases = checked
                                ? [...formData.use_case, id]
                                : formData.use_case.filter(uc => uc !== id)
                              setFormData(prev => ({ ...prev, use_case: newUseCases }))
                            }}
                            className="h-5 w-5"
                          />
                          <Label htmlFor={id} className="text-base">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-base font-medium"
                  disabled={isSubmitting || isAnimating}
                >
                  {isSubmitting ? 'Please wait...' : 'Next'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
} 