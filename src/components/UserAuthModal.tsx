import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Search, User, Shield, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SessionCodes {
  forwardCode: string;
  backwardCode: string;
  expiresAt: string;
}

interface UserCertificate {
  name: string;
  certificateTitle: string;
  issuer: string;
  status: 'verified' | 'not_verified';
  accuracyScore: number;
  issueDate: string;
  hash: string;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [sessionCodes, setSessionCodes] = useState<SessionCodes | null>(null);
  const [lookupCode, setLookupCode] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<UserCertificate[] | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Generate session codes when modal opens and user is authenticated
  useEffect(() => {
    if (isOpen && user && !sessionCodes) {
      generateSessionCodes();
    }
  }, [isOpen, user]);

  const generateSessionCodes = async () => {
    if (!user) return;

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.emailAddresses[0]?.emailAddress,
          userName: user.fullName || user.firstName || 'Unknown User'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionCodes(data.sessionCodes);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate session codes",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating session codes:', error);
      toast({
        title: "Error",
        description: "Failed to connect to authentication service",
        variant: "destructive"
      });
    }
  };

  const handleLookupUser = async () => {
    if (!lookupCode.trim()) return;

    setIsLookingUp(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const response = await fetch(`http://localhost:3001/api/auth/${lookupCode.trim()}`);
      
      if (response.ok) {
        const data = await response.json();
        setLookupResult(data.certificates);
      } else {
        const errorData = await response.json();
        setLookupError(errorData.error || 'Invalid or Expired Code');
      }
    } catch (error) {
      console.error('Error looking up user:', error);
      setLookupError('Failed to connect to authentication service');
    }

    setIsLookingUp(false);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      toast({
        title: "Copied!",
        description: `${type} code copied to clipboard`,
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'verified' ? (
      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
        Verified
      </Badge>
    ) : (
      <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
        Not Verified
      </Badge>
    );
  };

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return 'Expired';
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <Card className="glass-effect border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  User Authentication
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <Tabs defaultValue="codes" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="codes">My Session Codes</TabsTrigger>
                    <TabsTrigger value="lookup">Code Lookup</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="codes" className="space-y-4">
                    {user ? (
                      <>
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-semibold">Your Session Codes</h3>
                          <p className="text-sm text-muted-foreground">
                            Share these codes with others to let them view your certificates
                          </p>
                        </div>

                        {sessionCodes ? (
                          <div className="space-y-4">
                            {/* Forward Code */}
                            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                      Forward Code
                                    </p>
                                    <p className="text-lg font-mono font-bold">
                                      {sessionCodes.forwardCode}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(sessionCodes.forwardCode, 'Forward')}
                                    className="h-8 w-8"
                                  >
                                    {copiedCode === 'Forward' ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Backward Code */}
                            <Card className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-500/20">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                      Backward Code
                                    </p>
                                    <p className="text-lg font-mono font-bold">
                                      {sessionCodes.backwardCode}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(sessionCodes.backwardCode, 'Backward')}
                                    className="h-8 w-8"
                                  >
                                    {copiedCode === 'Backward' ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Expiry Info */}
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                Codes expire in: <span className="font-medium text-foreground">
                                  {formatExpiryTime(sessionCodes.expiresAt)}
                                </span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Generating session codes...</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Please sign in to generate session codes</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="lookup" className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">User Code Lookup</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter a session code to view another user's certificates
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Enter User Session Code
                        </label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter session code (e.g., FW-9X72KD)"
                            value={lookupCode}
                            onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                            className="font-mono"
                          />
                          <Button
                            onClick={handleLookupUser}
                            disabled={!lookupCode.trim() || isLookingUp}
                            className="px-6"
                          >
                            {isLookingUp ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                                Looking up...
                              </>
                            ) : (
                              <>
                                <Search className="h-4 w-4 mr-2" />
                                Fetch User
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter a valid session code to view another user's profile and certificates
                        </p>
                      </div>

                      {/* Error Display */}
                      {lookupError && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <X className="h-4 w-4 text-red-500" />
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              {lookupError}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {/* Results Display */}
                      {lookupResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="h-4 w-4 text-green-500" />
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                User Found - Certificate Details
                              </span>
                            </div>
                          </div>

                          {/* Responsive Table */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">Name</TableHead>
                                    <TableHead className="font-semibold">Certificate Title</TableHead>
                                    <TableHead className="font-semibold">Issuer</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Accuracy</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {lookupResult.map((cert, index) => (
                                    <TableRow key={index} className="hover:bg-muted/30">
                                      <TableCell className="font-medium">
                                        {cert.name}
                                      </TableCell>
                                      <TableCell>
                                        <div className="max-w-[200px] truncate" title={cert.certificateTitle}>
                                          {cert.certificateTitle}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="max-w-[150px] truncate" title={cert.issuer}>
                                          {cert.issuer}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {getStatusBadge(cert.status)}
                                      </TableCell>
                                      <TableCell>
                                        <span className={`font-medium ${
                                          cert.accuracyScore >= 90 ? 'text-green-500' : 
                                          cert.accuracyScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                                        }`}>
                                          {cert.accuracyScore}%
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          {/* Mobile-friendly card view for small screens */}
                          <div className="md:hidden space-y-3">
                            {lookupResult.map((cert, index) => (
                              <Card key={index} className="p-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-medium">{cert.name}</h4>
                                    {getStatusBadge(cert.status)}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{cert.certificateTitle}</p>
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">Issuer:</span> {cert.issuer}
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">Accuracy:</span>{' '}
                                    <span className={`font-medium ${
                                      cert.accuracyScore >= 90 ? 'text-green-500' : 
                                      cert.accuracyScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                      {cert.accuracyScore}%
                                    </span>
                                  </p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const getStatusBadge = (status: string) => {
  return status === 'verified' ? (
    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
      Verified
    </Badge>
  ) : (
    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
      Not Verified
    </Badge>
  );
};