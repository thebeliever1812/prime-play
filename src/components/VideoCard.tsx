"use client"
import Image from 'next/image'
import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { useAppSelector } from '@/lib/hook';
import { api } from '@/utils/api';
import axios from 'axios';
import DeletePopUp from './DeletePopUp';

interface Video {
    _id: string;
    title: string;
    description: string;
    thumbnail: string;
    createdAt: string;
    views: number;
    owner: string;
}

interface VideoCardProps {
    _id?: string;
    username?: string
    fullName?: string;
    title: string;
    description: string;
    uploadDate: string;
    thumbnail: string;
    views: number;
    avatarUrl?: string;
    ownerId?: string
    setVideos?: React.Dispatch<React.SetStateAction<Video[]>>;
    duration?: number;
}

const VideoCard: React.FC<VideoCardProps> = ({ _id, title, uploadDate, thumbnail, views, avatarUrl, username, fullName, ownerId, setVideos, duration }) => {
    const formattedUploadDate = formatDistanceToNow(new Date(uploadDate), { addSuffix: true });
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const [showDeletePopUp, setShowDeletePopUp] = useState<boolean>(false);

    const router = useRouter();

    const user = useAppSelector(state => state.user.user)

    const isAuthorised = ownerId ? user?._id === ownerId : false;

    const handleDeleteMyVideo = async () => {
        try {
            const videoId = _id;
            await api.delete(`/video/delete-video/${videoId}`);
            if (setVideos) {
                setVideos(prevVideos => prevVideos.filter(video => video._id !== videoId));
            }
            setShowOptions(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Error removing video from watch history:', error.response?.data?.message || error.message);
            } else {
                console.log('Unexpected error while removing video from watch history:', error);
            }
        }
    }

    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);

        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    return (
        <div className='w-full max-w-md rounded-lg shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-1 cursor-pointer hover:shadow-xl transition-shadow duration-300 group' onClick={() => router.push(`/video/${_id}`)} role="button">
            <div className='w-full aspect-video rounded-lg relative overflow-hidden'>
                <Image
                    src={thumbnail}
                    alt={title}
                    fill
                    objectFit='cover'
                    className='rounded-lg object-cover group-hover:scale-105 transition-transform duration-300'
                    loading='lazy'
                />
                {/* Play button overlay */}
                <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-0 transition-opacity duration-300'>
                    <Image width={40} height={40} src={"/play_icon.svg"} alt='play icon' objectFit='cover' />
                </div>
                {duration && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/50 text-white text-xs font-medium rounded">
                        {formatTime(duration)}
                    </div>
                )}
            </div>
            {/* Video details */}
            <div className='w-full px-2 flex justify-between items-start gap-1 sm:gap-2 mt-4 mb-2'>
                <div className='flex items-start gap-1 sm:gap-2 w-full'>
                    {avatarUrl && (
                        <div className='w-10 h-10 relative rounded-full overflow-hidden shrink-0' onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/channel/${username}`)
                        }}>
                            <Image
                                src={avatarUrl}
                                alt='Avatar'
                                fill
                                className='rounded-full'
                            />
                        </div>
                    )}
                    <div className='w-full'>
                        <h2 className='font-semibold text-lg'>{title.length > 55 ? `${title.substring(0, 55)}...` : title}</h2>
                        <span className='text-xs text-gray-500'>{fullName}</span>
                        <div className='w-full flex items-center justify-between mt-1'>
                            <span className='text-xs text-gray-500'>Uploaded: {formattedUploadDate}</span>
                            <span className='text-xs text-gray-500'>{views} views</span>
                        </div>
                    </div>
                </div>

                {
                    isAuthorised &&
                    <button className='mt-1 sm:mt-3 relative cursor-pointer' onClick={(e) => {
                        e.stopPropagation()
                        setShowOptions(prev => !prev)
                    }}>
                        <EllipsisVertical />
                        {
                            showOptions &&
                            <>
                                <div className='fixed w-full h-full bg-black/40 top-0 left-0 z-50 '>
                                </div>
                                <ul className='w-64 sm:w-72 text-sm sm:text-base absolute bg-[#F8FAFC] z-50 translate-y-1 right-0 rounded-md p-1 sm:p-1.5 flex flex-col items-start space-y-1 duration-150 ease-in' >
                                    <li className='w-full p-1 rounded-sm hover:bg-[#E2E8F0] flex gap-1 sm:gap-2 items-center justify-start'><Pencil className='w-[18px] sm:w-[20px] active:bg-[#E2E8F0]' />Edit</li>
                                    <li className='w-full p-1 rounded-sm hover:bg-[#E2E8F0] flex gap-1 items-center justify-start sm:gap-2' onClick={(e) => {
                                        e.stopPropagation();
                                        setShowOptions(false);
                                        setShowDeletePopUp(true);
                                    }}><Trash2 className='w-[18px] sm:w-[20px] active:bg-[#E2E8F0]' />Delete</li>
                                </ul>
                            </>
                        }
                    </button>
                }
            </div>
            {
                showDeletePopUp && (
                    <DeletePopUp message='Do you really want to delete this video?' setShow={setShowDeletePopUp} deleteAction={handleDeleteMyVideo} />
                )
            }
        </div>
    )
}

export default VideoCard