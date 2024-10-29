"use client";

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Onboarding() {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        age: '',
        income: '',
        investmentExperience: '',
        riskTolerance: '',
        investmentGoal: '',
        preferredAssets: [],
        expectedReturn: '',
        investmentHorizon: ''
    })

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const nextStep = () => setStep(prev => Math.min(prev + 1, 4))
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log('Form submitted:', formData)
        // Here you would typically send the data to your backend
    }

    return (
        <section className="flex items-center justify-center min-h-screen">
            <Card className="w-[550px]">
                <CardHeader>
                    <CardTitle>Investment Onboarding</CardTitle>
                    <CardDescription>Step {step} of 4</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">Personal Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e) => updateFormData('firstName', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) => updateFormData('lastName', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => updateFormData('age', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="income">Annual Income</Label>
                                    <Input
                                        id="income"
                                        type="number"
                                        value={formData.income}
                                        onChange={(e) => updateFormData('income', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">Financial Profile</h2>
                                <div className="space-y-2">
                                    <Label>Investment Experience</Label>
                                    <Select onValueChange={(value) => updateFormData('investmentExperience', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select experience level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="beginner">Beginner</SelectItem>
                                            <SelectItem value="intermediate">Intermediate</SelectItem>
                                            <SelectItem value="advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Risk Tolerance</Label>
                                    <RadioGroup onValueChange={(value) => updateFormData('riskTolerance', value)}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="low" id="low" />
                                            <Label htmlFor="low">Low</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="medium" id="medium" />
                                            <Label htmlFor="medium">Medium</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="high" id="high" />
                                            <Label htmlFor="high">High</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="investmentGoal">Investment Goal</Label>
                                    <Input
                                        id="investmentGoal"
                                        value={formData.investmentGoal}
                                        onChange={(e) => updateFormData('investmentGoal', e.target.value)}
                                        placeholder="e.g., retirement, wealth accumulation"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">Investment Preferences</h2>
                                <div className="space-y-2">
                                    <Label>Preferred Asset Types</Label>
                                    <Select onValueChange={(value) => updateFormData('preferredAssets', value)} multiple>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select asset types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="stocks">Stocks</SelectItem>
                                            <SelectItem value="bonds">Bonds</SelectItem>
                                            <SelectItem value="real_estate">Real Estate</SelectItem>
                                            <SelectItem value="crypto">Cryptocurrency</SelectItem>
                                            <SelectItem value="mutual_funds">Mutual Funds</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expectedReturn">Expected Annual Return (%)</Label>
                                    <Input
                                        id="expectedReturn"
                                        type="number"
                                        value={formData.expectedReturn}
                                        onChange={(e) => updateFormData('expectedReturn', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Investment Horizon</Label>
                                    <Select onValueChange={(value) => updateFormData('investmentHorizon', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select horizon" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="short_term">Short-term (1-3 years)</SelectItem>
                                            <SelectItem value="medium_term">Medium-term (3-10 years)</SelectItem>
                                            <SelectItem value="long_term">Long-term (10+ years)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">Confirmation</h2>
                                <p>Please review your information:</p>
                                <div className="space-y-2">
                                    <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                                    <p><strong>Age:</strong> {formData.age}</p>
                                    <p><strong>Income:</strong> ${formData.income}</p>
                                    <p><strong>Investment Experience:</strong> {formData.investmentExperience}</p>
                                    <p><strong>Risk Tolerance:</strong> {formData.riskTolerance}</p>
                                    <p><strong>Investment Goal:</strong> {formData.investmentGoal}</p>
                                    <p><strong>Preferred Assets:</strong> {formData.preferredAssets.join(", ")}</p>
                                    <p><strong>Expected Return:</strong> {formData.expectedReturn}%</p>
                                    <p><strong>Investment Horizon:</strong> {formData.investmentHorizon}</p>
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                    {step > 1 && (
                        <Button onClick={prevStep} variant="outline">
                            Previous
                        </Button>
                    )}
                    {step < 4 ? (
                        <Button onClick={nextStep}>Next</Button>
                    ) : (
                        <Button onClick={handleSubmit}>Submit</Button>
                    )}
                </CardFooter>
            </Card>
        </section>
    )
}
