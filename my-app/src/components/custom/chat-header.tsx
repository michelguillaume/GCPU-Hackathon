'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/custom/model-selector';
import { SidebarToggle } from '@/components/custom/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { BetterTooltip } from '@/components/ui/tooltip';

import { PlusIcon, VercelIcon } from './icons';
import { useSidebar } from '../ui/sidebar';
import { AiOutlineFilePdf } from 'react-icons/ai';

export function ChatHeader({ selectedModelId, reportId }: { selectedModelId: string, reportId: string }) {
    const router = useRouter();
    const { open } = useSidebar();

    const { width: windowWidth } = useWindowSize();

    return (
        <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
            <SidebarToggle />
            {(!open || windowWidth < 768) && (
                <BetterTooltip content="New Chat">
                    <Button
                        variant="outline"
                        className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
                        onClick={() => {
                            router.push('/');
                            router.refresh();
                        }}
                    >
                        <PlusIcon />
                        <span className="md:sr-only">New Chat</span>
                    </Button>
                </BetterTooltip>
            )}
            <ModelSelector
                selectedModelId={selectedModelId}
                className="order-1 md:order-2"
            />
            <Button
                className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 hidden md:flex py-1.5 px-2 h-fit md:h-[34px] order-4 md:ml-auto"
                asChild
            >
                <Link
                    href={`https://storage.googleapis.com/filing-pdf/filings/${reportId}.pdf`}
                    target="_blank"
                >
                    <AiOutlineFilePdf size={16} />
                    Open PDF in a new tab
                </Link>
            </Button>
        </header>
    );
}
