"use client"
import { api } from '@/utils/api';
import { cn } from '@/utils/cn';
import axios from 'axios';
import { Clock, EllipsisVertical, Trash2 } from 'lucide-react';
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

interface Owner {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
}

interface Video {
    _id: string;
    title: string;
    thumbnail: string;
    description: string;
    videoFile: string;
    duration: number;
    views: number;
    owner: Owner
}

interface WatchHistoryVideoCardProps {
    _id: string;
    title: string;
    thumbnail: string;
    views: number;
    fullName: string;
    duration: number;
    avatar: string;
    username: string;
    setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
}

const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const WatchHistoryVideoCard: React.FC<WatchHistoryVideoCardProps> = ({ _id, title, thumbnail, views, fullName, avatar, duration, username, setVideos }) => {
    const router = useRouter()
    const [showOptions, setShowOptions] = useState<boolean>(false);

    useEffect(() => {
        const body = document.body
        if (showOptions) {
            body.style.position = "fixed";
            body.style.top = "0";
            body.style.left = "0";
            body.style.width = "100%";
            body.style.overflowY = "scroll"; // keep scrollbar visible
        } else {
            body.style.position = "";
            body.style.top = "";
            body.style.left = "";
            body.style.width = "";
            body.style.overflowY = "";
        }

        return () => {
            body.style.position = "";
            body.style.top = "";
            body.style.left = "";
            body.style.width = "";
            body.style.overflowY = "";
        };
    }, [showOptions]);

    const handleRemoveFromWatchHistory = async () => {
        try {
            const videoId = _id;
            await api.delete(`/user/delete-from-history/${videoId}`);
            setVideos(prevVideos => prevVideos.filter(video => video._id !== videoId));
            setShowOptions(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Error removing video from watch history:', error.response?.data?.message || error.message);
            } else {
                console.log('Unexpected error while removing video from watch history:', error);
            }
        }
    }

    return (
        <div
            className={cn(
                "group flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 rounded-xl cursor-pointer",
                "bg-card hover:bg-muted/50 transition-all duration-200",
                "border border-transparent hover:border-border/50",
                "hover:shadow-md"
            )}
            onClick={() => router.push(`/video/${_id}`)}
        >
            {/* Thumbnail */}
            <div className="w-full sm:max-w-56 md:max-w-64 aspect-video relative shrink-0 rounded-lg overflow-hidden bg-gray-400">
                <Image
                    src={thumbnail}
                    alt={title}
                    fill
                    objectFit='cover'
                    className='rounded-[10px] w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                    loading='lazy'
                />

                {/* Play overlay */}
                <div className='w-full h-full absolute inset-0 bg-black/40 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                    <div className='w-full h-full flex justify-center  items-center'>
                        <Image width={40} height={40} src={"/play_icon.svg"} alt='play icon' objectFit='cover' />
                    </div>
                </div>

                {/* Duration badge */}
                {duration && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/50 text-white text-xs font-medium rounded flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(duration)}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="w-full flex justify-between gap-2 items-start">
                <div className='flex-1 min-w-0 flex flex-col justify-center py-1'>
                    {/* Title */}
                    <h3 className="font-semibold text-black text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-indigo-500 transition-colors">
                        {title}
                    </h3>

                    {/* Channel info */}
                    <div className="flex items-center gap-2 mt-2 ">
                        <div className="flex items-center gap-2" onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/channel/${username}`)
                        }}>
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                <Image
                                    src={avatar}
                                    alt={fullName}
                                    width={36}
                                    height={36}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-sm sm:text-base text-gray-500 truncate">
                                {fullName}
                            </span>
                        </div>
                    </div>

                    {/* Views */}
                    <div className="flex items-center text-sm text-gray-500 ml-1 mt-2">
                        <span>{views} views</span>
                    </div>
                </div>

                {/* Options menu */}
                <button className='relative cursor-pointer hover:bg-gray-100 p-2 rounded-full' onClick={(e) => {
                    e.stopPropagation()
                    setShowOptions(prev => !prev)
                }}>
                    <EllipsisVertical />
                    {
                        showOptions &&
                        <>
                            <div className='fixed w-full h-full bg-black/40 top-0 left-0 z-50 '>
                            </div>
                            <ul className='w-64 sm:w-72 text-sm sm:text-base absolute bg-[#F8FAFC] z-50 translate-y-1 right-0 rounded-md px-1.5 sm:px-3 py-1 flex flex-col items-start space-y-1 duration-150 ease-in' >
                                <li className='w-full p-1 rounded-sm hover:bg-[#E2E8F0] flex gap-1 items-center justify-start' onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFromWatchHistory();
                                }}><Trash2 className='w-[18px] sm:w-[20px] active:bg-[#E2E8F0]' />Remove from Watch History</li>
                            </ul>
                        </>
                    }
                </button>
            </div>
        </div>
    )
}

export default WatchHistoryVideoCard