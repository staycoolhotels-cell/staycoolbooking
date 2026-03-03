'use client';

import React, { useState, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import './style.css';
import { signUpUser, login, signInWithMobile, verifyMobileOtp } from '@/lib/auth-actions';

// Submit button component that shows loading state
function SubmitButton({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} onClick={onClick}>
      {pending ? 'Processing...' : children}
    </button>
  );
}

const ModernAuthForm: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [selectedRole, setSelectedRole] = useState('guest'); // Default role

  // Auth Method State: 'email' | 'phone'
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');

  // Form state for Email/Password Signup
  const [signupState, signupAction] = useActionState<any, FormData>(signUpUser, undefined);

  // Form state for Email/Password Login
  const [loginState, loginAction] = useActionState<any, FormData>(login, undefined);

  // Form state for Mobile OTP
  const [mobileActionState, mobileAction] = useActionState(async (prevState: any, formData: FormData) => {
    if (!otpSent) {
      // Send OTP
      const result = await signInWithMobile(prevState, formData);
      if (typeof result === 'object' && result?.success) {
        setOtpSent(true);
        return undefined; // Clear error
      }
      return result; // Error message
    } else {
      // Verify OTP
      return await verifyMobileOtp(prevState, formData);
    }
  }, undefined);

  const handleRegisterClick = () => {
    setIsActive(true);
    setAuthMethod('email'); // Reset to email on switch
    setOtpSent(false);
  };

  const handleLoginClick = () => {
    setIsActive(false);
    setAuthMethod('email'); // Reset to email on switch
    setOtpSent(false);
  };

  const toggleAuthMethod = () => {
    setAuthMethod(prev => prev === 'email' ? 'phone' : 'email');
    setOtpSent(false);
  };

  return (
    <div className={`container ${isActive ? 'active' : ''}`} id="container">
      {/* Sign Up Form Container */}
      <div className="form-container sign-up">
        {authMethod === 'email' ? (
          <form action={signupAction}>
            <h1>Create Account</h1>
            <div className="social-icons">
              {/* Social Icons kept for visual consistency, though functionality might be pending */}
              <a href="#" className="icon"><i className="fa-brands fa-google-plus-g"></i></a>
              <a href="#" className="icon"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" className="icon"><i className="fa-brands fa-github"></i></a>
              <a href="#" className="icon"><i className="fa-brands fa-linkedin-in"></i></a>
            </div>
            <span>or use your email for registration</span>

            {signupState && (typeof signupState === 'string' ? (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>
                {signupState}
              </div>
            ) : signupState.message && (
              <div className="error-message" style={{ color: signupState.success ? 'green' : 'red', marginBottom: '10px', fontSize: '14px' }}>
                {signupState.message}
              </div>
            ))}

            <input type="text" name="fullName" placeholder="Name" required />
            <input type="email" name="email" placeholder="Email" required />
            <input type="password" name="password" placeholder="Password" required />
            <input type="password" name="confirmPassword" placeholder="Confirm Password" required />
            <select
              name="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-2 mt-2 rounded-md bg-white border border-gray-300 text-black"
            >
              <option value="guest">Guest</option>
              <option value="host">Host</option>
            </select>
            <SubmitButton>Sign Up</SubmitButton>

            <button type="button" onClick={toggleAuthMethod} className="mt-4 text-sm text-blue-600 hover:underline bg-transparent border-none shadow-none text-black">
              Sign up with Mobile Number used
            </button>
          </form>
        ) : (
          <form action={mobileAction}>
            <h1>Mobile Sign Up</h1>
            <span>Use your mobile number to get started</span>

            {mobileActionState && (typeof mobileActionState === 'string') && (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>
                {mobileActionState}
              </div>
            )}

            {!otpSent ? (
              <>
                <input type="text" name="fullName" placeholder="Name" required />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Mobile Number (+91...)"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
                <select
                  name="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-2 mt-2 rounded-md bg-white border border-gray-300 text-black mb-4"
                >
                  <option value="guest">Guest</option>
                  <option value="host">Host</option>
                </select>
                <SubmitButton>Send OTP</SubmitButton>
              </>
            ) : (
              <>
                <input type="hidden" name="phone" value={mobileNumber} />
                <input type="hidden" name="role" value={selectedRole} />
                {/* We might need to handle name persistence for verification if simpler flow desired, 
                    but here we assume name was needed for initial signup intent or verification takes it if provided again/hidden. 
                    Ideally verifyOtp doesn't need name if user exists, but for new users it's good. 
                    Current action implementation for verifyMobileOtp reads 'name'.
                    So we should pass it hidden.
                */}
                <input type="text" name="otp" placeholder="Enter OTP" required />
                <SubmitButton>Verify OTP</SubmitButton>
              </>
            )}

            <button type="button" onClick={toggleAuthMethod} className="mt-4 text-sm text-blue-600 hover:underline bg-transparent border-none shadow-none text-black">
              Sign up with Email
            </button>
          </form>
        )}
      </div>

      {/* Sign In Form Container */}
      <div className="form-container sign-in">
        {authMethod === 'email' ? (
          <form action={loginAction}>
            <h1>Sign In</h1>
            <div className="social-icons">
              <a href="#" className="icon"><i className="fa-brands fa-google-plus-g"></i></a>
              <a href="#" className="icon"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" className="icon"><i className="fa-brands fa-github"></i></a>
              <a href="#" className="icon"><i className="fa-brands fa-linkedin-in"></i></a>
            </div>
            <span>or use your email password</span>

            {loginState && (typeof loginState === 'string' ? (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>
                {loginState}
              </div>
            ) : loginState.message && (
              <div className="error-message" style={{ color: loginState.success ? 'green' : 'red', marginBottom: '10px', fontSize: '14px' }}>
                {loginState.message}
              </div>
            ))}

            <input type="email" name="email" placeholder="Email" required />
            <input type="password" name="password" placeholder="Password" required />
            <a href="#">Forget Your Password?</a>
            <SubmitButton>Sign In</SubmitButton>

            <button type="button" onClick={toggleAuthMethod} className="mt-4 text-sm text-blue-600 hover:underline bg-transparent border-none shadow-none text-black">
              Sign inside with Mobile Number
            </button>
          </form>
        ) : (
          <form action={mobileAction}>
            <h1>Mobile Sign In</h1>
            <span>Enter your mobile number to log in</span>

            {mobileActionState && (typeof mobileActionState === 'string') && (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>
                {mobileActionState}
              </div>
            )}

            {!otpSent ? (
              <>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Mobile Number (+91...)"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
                <SubmitButton>Send OTP</SubmitButton>
              </>
            ) : (
              <>
                <input type="hidden" name="phone" value={mobileNumber} />
                <input type="text" name="otp" placeholder="Enter OTP" required />
                <SubmitButton>Verify OTP</SubmitButton>
              </>
            )}

            <button type="button" onClick={toggleAuthMethod} className="mt-4 text-sm text-blue-600 hover:underline bg-transparent border-none shadow-none text-black">
              Sign in with Email
            </button>
          </form>
        )}
      </div>

      {/* Toggle Panels for switching between forms */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Welcome Back!</h1>
            <p>Enter your personal details to use all of site features</p>
            <button className="hidden" id="login" onClick={handleLoginClick}>
              Sign In
            </button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Hello, Friend!</h1>
            <p>Register with your personal details to use all of site features</p>
            <button className="hidden" id="register" onClick={handleRegisterClick}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernAuthForm;
