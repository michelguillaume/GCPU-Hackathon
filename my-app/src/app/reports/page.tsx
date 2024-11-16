"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { FileText, Search, Upload, Download, BarChart, Filter } from "lucide-react"
import { fetchData, Filing } from "@/app/actions/fetchData"
import { useRouter } from 'next/navigation';

// Composant pour les filtres
interface FilterSectionProps {
    selectedYear: string;
    setSelectedYear: (value: string) => void;
    selectedQuarter: string;
    setSelectedQuarter: (value: string) => void;
    selectedCategory: string;
    setSelectedCategory: (value: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ selectedYear, setSelectedYear, selectedQuarter, setSelectedQuarter, selectedCategory, setSelectedCategory }) => (
    <div className="space-y-4">
        {/* Filtres pour Année, Trimestre et Catégorie */}
        <div>
            <Label htmlFor="year">Année</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                    <SelectValue placeholder="Sélectionner une année" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label htmlFor="quarter">Trimestre</Label>
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger id="quarter">
                    <SelectValue placeholder="Sélectionner un trimestre" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Q1">Q1</SelectItem>
                    <SelectItem value="Q2">Q2</SelectItem>
                    <SelectItem value="Q3">Q3</SelectItem>
                    <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label htmlFor="category">Catégorie</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="financial">Financier</SelectItem>
                    <SelectItem value="operational">Opérationnel</SelectItem>
                    <SelectItem value="strategic">Stratégique</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
)

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
                // Utilisez router.push pour rediriger
                router.push(`/chat/${report.id}`);
            } else {
                console.error("Failed to fetch the report", data);
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
                <Button variant="outline" className="flex-shrink-0" href={report.linkToTxt} target="_blank">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger
                </Button>
                <Button className="flex-shrink-0" onClick={handleViewClick}>
                    <BarChart className="mr-2 h-4 w-4" />
                    Voir
                </Button>
            </CardFooter>
        </Card>
    );
};

const ReportsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [selectedYear, setSelectedYear] = useState<string>("")
    const [selectedQuarter, setSelectedQuarter] = useState<string>("")
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [reports, setReports] = useState<Filing[]>([])
    const [totalReports, setTotalReports] = useState<number>(0)
    const [page, setPage] = useState<number>(0)
    const pageSize = 6

    useEffect(() => {
        async function loadReports() {
            try {
                const data = await fetchData(page, pageSize)
                setReports(data.filings)
                setTotalReports(data.total.value)
            } catch (error) {
                console.error("Failed to load reports:", error)
            }
        }

        loadReports()
    }, [page])

    const totalPages = Math.ceil(totalReports / pageSize)

    const handlePreviousPage = () => {
        if (page > 0) setPage(page - 1)
    }

    const handleNextPage = () => {
        if (page < totalPages - 1) setPage(page + 1)
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center mb-2">
                        <FileText className="mr-2 h-8 w-8 text-blue-600"/>
                        <h1 className="text-3xl font-bold">Reports</h1>
                    </div>
                    <p className="text-gray-600">
                        Liste des rapports financiers pour analyse et gestion (Total : {totalReports})
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-1/4 hidden lg:block">
                        <h2 className="text-xl font-semibold mb-4">Filtres</h2>
                        <FilterSection
                            selectedYear={selectedYear}
                            setSelectedYear={setSelectedYear}
                            selectedQuarter={selectedQuarter}
                            setSelectedQuarter={setSelectedQuarter}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                        />
                    </aside>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
                                <Input
                                    type="search"
                                    placeholder="Rechercher un rapport..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" className="lg:hidden">
                                            <Filter className="mr-2 h-4 w-4"/>
                                            Filtres
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent>
                                        <SheetHeader>
                                            <SheetTitle>Filtres</SheetTitle>
                                            <SheetDescription>
                                                Affinez votre recherche de rapports
                                            </SheetDescription>
                                        </SheetHeader>
                                        <div className="mt-4">
                                            <FilterSection
                                                selectedYear={selectedYear}
                                                setSelectedYear={setSelectedYear}
                                                selectedQuarter={selectedQuarter}
                                                setSelectedQuarter={setSelectedQuarter}
                                                selectedCategory={selectedCategory}
                                                setSelectedCategory={setSelectedCategory}
                                            />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                                <Button>
                                    <Upload className="mr-2 h-4 w-4"/>
                                    Upload New Report
                                </Button>
                            </div>
                        </div>

                        <div className="mb-4 text-gray-600">
                            {selectedYear && <span>Année: {selectedYear}</span>}
                            {selectedQuarter && <span> | Trimestre: {selectedQuarter}</span>}
                            {selectedCategory && <span> | Catégorie: {selectedCategory}</span>}
                        </div>

                        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
                            {reports.length > 0 ? (
                                reports.map((report) => <ReportCard report={report} key={report.id} />)
                            ) : (
                                <p className="text-center text-gray-500">Aucun rapport ne correspond aux critères.</p>
                            )}
                        </div>

                        <div className="flex justify-center gap-4 mt-6">
                            <Button onClick={handlePreviousPage} disabled={page === 0}>
                                Page Précédente
                            </Button>
                            <Button onClick={handleNextPage} disabled={page >= totalPages - 1}>
                                Page Suivante
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReportsPage
