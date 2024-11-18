"use client"

import React, {useState, useEffect} from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {FileText, Download, BarChart, Filter} from "lucide-react"
import { fetchData, Filing } from "@/app/actions/fetchData"
import { useRouter } from 'next/navigation';
import {Skeleton} from "@/components/ui/skeleton";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    DropdownMenu, DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

function DatePicker({ selectedDate, setSelectedDate }: { selectedDate?: Date; setSelectedDate: (date?: Date) => void }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full text-left">
                    {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
            </PopoverContent>
        </Popover>
    );
}

function FormTypeDropdown({
                              excludedTypes,
                              setExcludedTypes,
                          }: {
    excludedTypes: string[];
    setExcludedTypes: (types: string[]) => void;
}) {
    const formTypes = [
        "10-K", // Annual report
        "10-Q", // Quarterly report
        "6-K",
        "8-K", // Major changes
        "13F", // Institutional holdings
        "SC 13D", // Acquisition declaration (>5%)
        "SC 13D/A", // SC 13D amendment
        "SC 13G", // Passive declaration (>5%)
        "SC 13G/A", // SC 13G amendment
        "Form 3", // Initial declaration
        "Form 4", // Changes in ownership
        "Form 5", // Undeclared transactions
        "S-1", // Initial registration
        "424B4", // Final prospectus
        "Form D", // Private offerings
        "DEF 14A", // Proxy statement
        "Form ADV", // Investment advisers
        "ABS-15G", // Asset-backed securities
        "1-U", // Reports for regulated companies
    ];

    const [checkedStates, setCheckedStates] = useState<Record<string, boolean>>(
        formTypes.reduce((acc, type) => {
            acc[type] = excludedTypes.includes(type);
            return acc;
        }, {} as Record<string, boolean>)
    );

    const handleCheckedChange = (type: string, checked: boolean) => {
        const newCheckedStates = { ...checkedStates, [type]: checked };

        const newExcluded = Object.entries(newCheckedStates)
            .filter(([_, state]) => state)
            .map(([key]) => key);

        setCheckedStates(newCheckedStates);
        setExcludedTypes(newExcluded);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full text-left">
                    Exclude Form Types
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" className="w-56 max-h-96 overflow-y-auto">
                <DropdownMenuLabel>Select types to exclude</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {formTypes.map((type) => (
                    <DropdownMenuCheckboxItem
                        key={type}
                        checked={checkedStates[type]}
                        onCheckedChange={(checked) => handleCheckedChange(type, checked)}
                        onSelect={(e) => e.preventDefault()}
                    >
                        {type}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

interface ReportCardProps {
    report: Filing;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
    const router = useRouter();

    const handleViewClick = async () => {
        try {
            const response = await fetch('/api/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportId: report.id,
                    filingUrl: report.linkToFilingDetails,
                    accessionNo: report.accessionNo,
                    companyName: report.companyName,
                    filedAt: report.filedAt,
                    formType: report.formType,
                    ticker: report.ticker
                }),
            });

            const data = await response.json();
            if (response.ok) {
                const chatId = data.chatId;
                router.push(`/chat/${chatId}`);
            } else {
                console.error("Failed to fetch the report", data);
            }
        } catch (error) {
            console.error("Error calling API:", error);
        }
    };

    const handleDownloadClick = async () => {
        try {
            const response = await fetch('/api/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportId: report.id,
                    filingUrl: report.linkToFilingDetails,
                    accessionNo: report.accessionNo,
                    companyName: report.companyName,
                    filedAt: report.filedAt,
                    formType: report.formType,
                    ticker: report.ticker
                }),
            });

            const data = await response.json();
            if (response.ok && data.fileURL) {
                const link = document.createElement('a');
                link.href = data.fileURL;
                link.target = '_blank';
                link.download = '';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                console.error("Failed to fetch the file URL", data.error || "Unknown error");
            }
        } catch (error) {
            console.error("Error calling API:", error);
        }
    };

    return (
        <Card key={report.id} className="flex flex-col justify-between h-full">
            <CardHeader>
                <CardTitle>{report.companyName}</CardTitle>
                <div className="text-sm text-gray-500">
                    {new Date(report.filedAt).toLocaleDateString()} | {report.ticker || "N/A"}
                </div>
            </CardHeader>
            <CardContent className="overflow-hidden max-h-24">
                <p className="text-gray-600">{report.description}</p>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={handleDownloadClick} className="flex-shrink-0">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
                <Button className="flex-shrink-0" onClick={handleViewClick}>
                    <BarChart className="mr-2 h-4 w-4" />
                    View
                </Button>
            </CardFooter>
        </Card>
    );
};

const SkeletonCard: React.FC = () => (
    <div className="flex flex-col space-y-3">
        <Skeleton className="h-[175px] w-[250px] rounded-xl" />

        <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
        </div>
    </div>
);

export function SkeletonGrid({ count }: { count: number }) {
    return (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
}

const ReportsPage: React.FC = () => {
    const [ticker, setTicker] = useState<string>("");
    const [companyName, setCompanyName] = useState<string>("");
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [excludedFormTypes, setExcludedFormTypes] = useState<string[]>([]);
    const [reports, setReports] = useState<Filing[]>([]);
    const [totalReports, setTotalReports] = useState<number>(0);
    const [page, setPage] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const pageSize = 6

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const data = await fetchData({
                page,
                pageSize,
                ticker,
                companyName,
                startDate: startDate ? new Date(startDate).toISOString() : undefined,
                endDate: endDate ? new Date(endDate).toISOString() : undefined,
                excludeFormTypes: excludedFormTypes,
            });
            setReports(data.filings);
            setTotalReports(data.total.value);
        } catch (error) {
            console.error("Failed to load reports:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, [page]);

    const resetFilters = () => {
        setTicker("");
        setCompanyName("");
        setStartDate(undefined);
        setEndDate(undefined);
        setExcludedFormTypes([]);
    };

    const totalPages = Math.ceil(totalReports / pageSize);

    const handlePreviousPage = () => {
        if (page > 0) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) setPage(page + 1);
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center mb-2">
                        <FileText className="mr-2 h-8 w-8 text-blue-600"/>
                        <h1 className="text-3xl font-bold">Reports</h1>
                    </div>
                    <p className="text-gray-600">
                        List of financial reports for analysis and management (Total: {totalReports})
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-1/4 hidden lg:block">
                        <h2 className="text-xl font-semibold mb-4">Filtres</h2>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="ticker">Search by Ticker</Label>
                                <Input
                                    id="ticker"
                                    placeholder="Enter ticker (e.g., TSLA)"
                                    value={ticker}
                                    onChange={(e) => setTicker(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="companyName">Search by Company Name</Label>
                                <Input
                                    id="companyName"
                                    placeholder="Enter company name"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>Form Types</Label>
                                <FormTypeDropdown excludedTypes={excludedFormTypes}
                                                  setExcludedTypes={setExcludedFormTypes}/>
                            </div>
                            <div>
                                <Label>Date de Début</Label>
                                <DatePicker selectedDate={startDate} setSelectedDate={setStartDate}/>
                            </div>
                            <div>
                                <Label>Date de Fin</Label>
                                <DatePicker selectedDate={endDate} setSelectedDate={setEndDate}/>
                            </div>
                            <div className="col-span-2 flex flex-wrap gap-4">
                                <Button className="flex-1" onClick={loadReports}>
                                    Apply Filters
                                </Button>
                                <Button className="flex-1" variant="outline" onClick={resetFilters}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1 min-w-0">
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="mb-4">
                                    <Filter className="mr-2 h-4 w-4"/>
                                        Filtres
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Filtres</SheetTitle>
                                        <SheetDescription>
                                            Affinez votre recherche de rapports financiers.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="space-y-4 mt-6">
                                        <div>
                                            <Label htmlFor="ticker">Search by Ticker</Label>
                                            <Input
                                                id="ticker"
                                                placeholder="Enter ticker (e.g., TSLA)"
                                                value={ticker}
                                                onChange={(e) => setTicker(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="companyName">Search by Company Name</Label>
                                            <Input
                                                id="companyName"
                                                placeholder="Enter company name"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Form Types</Label>
                                            <FormTypeDropdown excludedTypes={excludedFormTypes}
                                                              setExcludedTypes={setExcludedFormTypes}/>
                                        </div>
                                        <div>
                                            <Label>Date de Début</Label>
                                            <DatePicker selectedDate={startDate} setSelectedDate={setStartDate}/>
                                        </div>
                                        <div>
                                            <Label>Date de Fin</Label>
                                            <DatePicker selectedDate={endDate} setSelectedDate={setEndDate}/>
                                        </div>
                                        <div className="col-span-2 flex flex-wrap gap-4">
                                            <Button className="flex-1" onClick={loadReports}>
                                                Apply Filters
                                            </Button>
                                            <Button className="flex-1" variant="outline" onClick={resetFilters}>
                                                Reset
                                            </Button>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {isLoading ? (
                            <SkeletonGrid count={pageSize}/>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
                                {reports.length > 0 ? (
                                    reports.map((report) => (
                                        <ReportCard report={report} key={report.id}/>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500">Aucun rapport trouvé.</p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-center gap-4 mt-6">
                            <Button onClick={handlePreviousPage} disabled={page === 0}>
                                Previous
                            </Button>
                            <Button onClick={handleNextPage} disabled={page >= totalPages - 1}>
                                Next Page
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReportsPage
