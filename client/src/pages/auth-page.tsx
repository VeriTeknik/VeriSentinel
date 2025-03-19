import { useAuth } from "@/hooks/use-auth";
import AuthForm from "@/components/auth/auth-form";
import { Redirect } from "wouter";
import { Shield, Server, FileEdit, Clipboard } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading } = useAuth();

  // Redirect to dashboard if already logged in
  if (!isLoading && user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="flex flex-col md:flex-row overflow-hidden bg-white rounded-lg shadow-lg">
          {/* Auth Form Column */}
          <div className="w-full md:w-1/2 p-8 md:p-12">
            <div className="flex items-center space-x-2 mb-8">
              <svg className="h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-xl font-bold text-gray-900">Verisentinel</h1>
            </div>
            
            <AuthForm />
          </div>
          
          {/* Hero Column */}
          <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 text-white">
            <h2 className="text-3xl font-bold mb-6">Unified Compliance & Infrastructure Monitoring</h2>
            <p className="text-lg mb-8 text-primary-100">
              A single source of truth for managing and monitoring security compliance across your organization
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Integrated Compliance Framework</h3>
                  <p className="text-primary-100">Combine controls from PCI DSS, ISO 27001, and other standards with risk-based severity mapping</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Hardware Inventory & Topology</h3>
                  <p className="text-primary-100">Visual network topology with device inventory and compliance status</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <FileEdit className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Change Management</h3>
                  <p className="text-primary-100">Structured workflow for critical changes with approval process</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <Clipboard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Task Management</h3>
                  <p className="text-primary-100">Track compliance-related tasks with deadlines and assignments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
