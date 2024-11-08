"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {Checkbox} from "@/components/ui/checkbox";

const formSchema = z.object({
    firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
    lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
    age: z.string({ message: "Age is required." }).regex(/^\d+$/, { message: "Age must be a number." }),
    income: z.object({
        min: z.number(),
        max: z.number()
    }).refine((value) => value.min !== undefined, { message: "Please select your annual income range." }),
    investmentExperience: z.string({ message: "Investment experience is required." }),
    riskTolerance: z.string({ message: "Risk tolerance is required." }),
    investmentGoal: z.object({
        amount: z.string({ message: "Investment goal amount is required." }).regex(/^\d+$/, { message: "Investment goal amount must be a positive number." }),
        frequency: z.enum(["weekly", "monthly", "yearly"], { message: "Please select a valid frequency for your investment goal." })
    }),
    preferredAssets: z.array(z.string()).min(1, { message: "Select at least one preferred asset." }),
    expectedReturn: z.string({ message: "Expected return is required." }).regex(/^\d+$/, { message: "Return must be a number." }),
    investmentHorizon: z.string({ message: "Investment horizon is required." }),
});


const stepTitles = [
    "Investment Onboarding",
    "Personal Information",
    "Financial Profile",
    "Investment Preferences",
    "Confirmation"
];

const incomeRanges = [
    { id: "below_20k", label: "Below $20,000", min: 0, max: 20000 },
    { id: "20k_50k", label: "$20,000 - $50,000", min: 20000, max: 50000 },
    { id: "50k_100k", label: "$50,000 - $100,000", min: 50000, max: 100000 },
    { id: "100k_200k", label: "$100,000 - $200,000", min: 100000, max: 200000 },
    { id: "above_200k", label: "Above $200,000", min: 200000, max: Infinity },
];

const assetTypes = [
    { id: "stocks", label: "Stocks" },
    { id: "bonds", label: "Bonds" },
    { id: "real_estate", label: "Real Estate" },
    { id: "crypto", label: "Cryptocurrency" },
    { id: "mutual_funds", label: "Mutual Funds" },
];

export default function Onboarding() {
    const [step, setStep] = useState(1);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            age: '',
            income: '',
            investmentExperience: '',
            riskTolerance: '',
            investmentGoal: {
                amount: '',
                frequency: "monthly",
            },
            preferredAssets: [],
            expectedReturn: '',
            investmentHorizon: ''
        }
    });

    const validateStep = async () => {
        switch (step) {
            case 1:
                return await form.trigger(['firstName', 'lastName', 'age', 'income']);
            case 2:
                return await form.trigger(['investmentExperience', 'riskTolerance', 'investmentGoal']);
            case 3:
                return await form.trigger(['preferredAssets', 'expectedReturn', 'investmentHorizon']);
            default:
                return true;
        }
    };

    const nextStep = async () => {
        const isValid = await validateStep();
        if (isValid) {
            setStep((prev) => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const handleSubmit = (data) => {
        console.log('Form submitted:', data);
        // Send data to the backend or perform other actions
    };

    return (
        <section className="flex items-center justify-center min-h-screen">
            <Card className="w-[550px]">
                <CardHeader>
                    <CardTitle>{stepTitles[step]}</CardTitle>
                    <CardDescription>Step {step} of 4</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)}>
                            {step === 1 && (
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="age"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Age</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="30" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="income"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Annual Income</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            const range = incomeRanges.find((item) => item.id === value);
                                                            field.onChange({ min: range.min, max: range.max });
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select income range" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {incomeRanges.map((range) => (
                                                                <SelectItem key={range.id} value={range.id}>
                                                                    {range.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="investmentExperience"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Investment Experience</FormLabel>
                                                <FormControl>
                                                    <Select {...field} onValueChange={field.onChange}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select experience level" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="beginner">Beginner</SelectItem>
                                                            <SelectItem value="intermediate">Intermediate</SelectItem>
                                                            <SelectItem value="advanced">Advanced</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="riskTolerance"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Risk Tolerance</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        className="flex flex-col space-y-1"
                                                    >
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="low" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                Low
                                                            </FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="medium" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                Medium
                                                            </FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="high" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                High
                                                            </FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="investmentGoal.amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Investment Goal Amount</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Enter amount (e.g., 10000)"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="investmentGoal.frequency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Investment Goal Frequency</FormLabel>
                                                <FormControl>
                                                    <Select {...field} onValueChange={field.onChange}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select frequency" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="weekly">Weekly</SelectItem>
                                                            <SelectItem value="monthly">Monthly</SelectItem>
                                                            <SelectItem value="yearly">Yearly</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="preferredAssets"
                                        render={() => (
                                            <FormItem>
                                                <div className="mb-4">
                                                    <FormLabel className="text-base">Preferred Asset Types</FormLabel>
                                                    <p className="text-sm text-gray-600">
                                                        Select the types of assets you are interested in.
                                                    </p>
                                                </div>
                                                {assetTypes.map((asset) => (
                                                    <FormField
                                                        key={asset.id}
                                                        control={form.control}
                                                        name="preferredAssets"
                                                        render={({ field }) => (
                                                            <FormItem
                                                                key={asset.id}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(asset.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            field.onChange(
                                                                                checked
                                                                                    ? [...field.value, asset.id]
                                                                                    : field.value.filter((value) => value !== asset.id)
                                                                            );
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">{asset.label}</FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="expectedReturn"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Expected Annual Return (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="investmentHorizon"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Investment Horizon</FormLabel>
                                                <FormControl>
                                                    <Select {...field} onValueChange={field.onChange}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select horizon" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="short_term">Short-term (1-3 years)</SelectItem>
                                                            <SelectItem value="medium_term">Medium-term (3-10 years)</SelectItem>
                                                            <SelectItem value="long_term">Long-term (10+ years)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold">Confirmation</h2>
                                    <p>Please review your information:</p>
                                    <div className="space-y-2">
                                        <p>
                                            <strong>Name:</strong> {form.getValues('firstName')} {form.getValues('lastName')}
                                        </p>
                                        <p><strong>Age:</strong> {form.getValues('age')}</p>
                                        <p><strong>Income:</strong> ${form.getValues('income')}</p>
                                        <p><strong>Investment
                                            Experience:</strong> {form.getValues('investmentExperience')}</p>
                                        <p><strong>Risk Tolerance:</strong> {form.getValues('riskTolerance')}</p>
                                        <p><strong>Investment Goal
                                            amont:</strong> {form.getValues('investmentGoal.amount')}</p>
                                        <p><strong>Investment Goal
                                            frequency:</strong> {form.getValues('investmentGoal.frequency')}</p>
                                        <p><strong>Preferred
                                            Assets:</strong> {form.getValues('preferredAssets').join(", ")}</p>
                                        <p><strong>Expected Return:</strong> {form.getValues('expectedReturn')}%</p>
                                        <p><strong>Investment Horizon:</strong> {form.getValues('investmentHorizon')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </form>
                    </Form>
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
                        <Button type="submit" onClick={form.handleSubmit(handleSubmit)}>Submit</Button>
                    )}
                </CardFooter>
            </Card>
        </section>
    );
}
