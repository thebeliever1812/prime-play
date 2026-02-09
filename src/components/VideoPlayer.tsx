"use client";
import { api } from '@/utils/api';
import axios from 'axios';
import { EllipsisVertical, Loader2, Maximize, Minimize, Pause, Play, RotateCcw, VideoOff, Volume2, VolumeX } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Container, CustomLoader, LikeForm, SubscriptionForm } from './index';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from "react-hook-form"
import { CommentSchema } from '@/schemas/comment.schema';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppSelector } from '@/lib/hook';
import { toast } from 'react-toastify';

interface VideoPlayerProps {
    id: string;
}

interface Owner {
    _id: string;
    username: string;
    avatar: string;
    fullName: string;
    subscribersCount: number;
}

interface VideoData {
    _id: string;
    title: string;
    description: string;
    videoFile: string;
    createdAt: string;
    views: number;
    duration: number;
    owner: Owner;
    isLiked: boolean;
    likesCount: number
}

type CommentFormInput = z.infer<typeof CommentSchema>;

interface CommentOwner {
    _id: string;
    avatar: string;
    fullName: string;
}

interface Comment {
    _id: string
    content: string;
    createdAt: string;
    ownerDetails: CommentOwner;
}

interface ChannelData {
    _id: string;
    avatar: string;
    channelsSubscribedToCount: number;
    coverImage: string;
    email: string;
    fullName: string;
    isSubscribed: boolean;
    subscribersCount: number;
    username: string;
    videosCount: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ id }) => {
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [loadingVideo, setLoadingVideo] = useState<boolean>(true);
    const [showFullDescription, setShowFullDescription] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [postingComment, setPostingComment] = useState(false);
    const [comments, setComments] = useState<Comment[]>([])
    const [loadingComments, setLoadingComments] = useState<boolean>(true);
    const [isLoadingChannelData, setIsLoadingChannelData] = useState<boolean>(true)
    const [channelData, setChannelData] = useState<ChannelData | null>(null)
    const [fullscreen, setFullscreen] = useState<boolean>(false)
    const [showCustomControls, setShowCustomControls] = useState<boolean>(true);
    const [forwardIcon, setForwardIcon] = useState<boolean>(false);
    const [rewindIcon, setRewindIcon] = useState<boolean>(false);
    const [currentVideoTime, setCurrentVideoTime] = useState<string>('00:00');
    const [videoPercentage, setVideoPercentage] = useState<number>(0);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<HTMLDivElement | null>(null);

    const hideTimer = useRef<NodeJS.Timeout | null>(null);

    const forwardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const rewindTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const progressRef = useRef<HTMLDivElement | null>(null);

    const user = useAppSelector((state) => state.user.user)
    const isAuthenticated = !!user

    const router = useRouter()

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const response = await api.get(`/video/play-video/${id}`);
                setVideoData(response.data?.data || null);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.log('Error fetching video data:', error.response?.data?.message || error.message);
                } else {
                    console.log('Unexpected error while fetching video data:', error);
                }
            } finally {
                setLoadingVideo(false);
            }
        }
        fetchVideo();
    }, [id]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<CommentFormInput>({
        resolver: zodResolver(CommentSchema)
    })

    const onSubmit: SubmitHandler<CommentFormInput> = async (data) => {
        setPostingComment(true);
        if (!isAuthenticated) {
            toast.error("Please login to write a comment")
            setPostingComment(false)
            return
        }
        try {
            await api.post(`/comment`, {
                id,
                comment: data.comment
            });

            toast.success("Comment added successfully")
            reset()
            fetchComments();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('Error posting comment:', error.response?.data?.message || error.message);
            } else {
                console.log('Unexpected error while posting comment:', error);
            }
        } finally {
            setPostingComment(false);
        }
    }

    const fetchComments = useCallback(async () => {
        try {
            const response = await api.get(`/comment/video/${id}`);
            setComments(response.data?.data || []);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log(
                    'Error fetching comments:',
                    error.response?.data?.message || error.message
                );
            } else {
                console.log('Unexpected error while fetching comments:', error);
            }
        } finally {
            setLoadingComments(false);
        }
    }, [id]);

    useEffect(() => {
        if (videoData) {
            fetchComments();
        }
    }, [id, videoData, fetchComments]);

    // Subscription details k liy
    useEffect(() => {
        const fetchChannelData = async () => {
            try {
                const response = await api.get(`/user/channel/${videoData?.owner.username}`);
                console.log(response.data?.data)
                setChannelData(response.data?.data)
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.log('Error fetching channel data in layout:', error.response?.data?.message || error.message);
                } else {
                    console.log('Unexpected error while fetching channel data in layout:', error);
                }
            } finally {
                setIsLoadingChannelData(false)
            }
        }

        if (isAuthenticated) {
            fetchChannelData()
        }
    }, [videoData?.owner.username, isAuthenticated])

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = true; // must be set before play()
        video.play().catch(() => {
            console.log("Autoplay blocked");
        });
    }, []);

    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [])

    const toggleMute = useCallback(() => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    }, [])

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            playerRef.current?.requestFullscreen();
            setFullscreen(true);
        } else {
            document.exitFullscreen();
            setFullscreen(false);
        }
    };

    const restartVideo = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const showControlsTemporarily = () => {
        setShowCustomControls(true);

        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
        }

        hideTimer.current = setTimeout(() => {
            if (isPlaying) {
                setShowCustomControls(false);
            }
        }, 2500);
    };

    useEffect(() => {
        if (!isPlaying) {
            setShowCustomControls(true);
        }
        hideTimer.current = setTimeout(() => {
            if (isPlaying) {
                setShowCustomControls(false);
            }
        }, 2500);

        return () => {
            if (hideTimer.current) {
                clearTimeout(hideTimer.current);
            }
        };
    }, [isPlaying]);

    useEffect(() => {
        const handleKeyboardListners = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;

            // Ignore typing inside inputs, textarea, contenteditable
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            if (!videoRef.current) return;

            // Prevent page scroll on space
            if (e.code === "Space") {
                e.preventDefault();
            }

            switch (e.code) {
                case "Space":
                    togglePlay();
                    break;

                case "ArrowRight":
                    setForwardIcon(true);
                    if (forwardTimeoutRef.current) {
                        clearTimeout(forwardTimeoutRef.current);
                    }
                    forwardTimeoutRef.current = setTimeout(() => setForwardIcon(false), 500);
                    videoRef.current.currentTime += 10;
                    break;

                case "ArrowLeft":
                    setRewindIcon(true);
                    if (rewindTimeoutRef.current) {
                        clearTimeout(rewindTimeoutRef.current);
                    }
                    rewindTimeoutRef.current = setTimeout(() => setRewindIcon(false), 500);
                    videoRef.current.currentTime -= 10;
                    break;

                case "KeyM":
                    toggleMute();
                    break;

                case "KeyF":
                    handleFullscreen();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyboardListners);
        return () => window.removeEventListener("keydown", handleKeyboardListners);
    }, [togglePlay, toggleMute]);


    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);

        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function videoProgressInPercentage(currentTime: number, duration: number) {
        return (currentTime / duration) * 100;
    }

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || !progressRef.current) return;

        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;

        videoRef.current.currentTime =
            percentage * videoRef.current.duration;
    };

    const handleTimeUpdate = (videoData: VideoData) => {
        if (!videoRef.current) return;

        const current = videoRef.current.currentTime;
        setVideoPercentage(videoProgressInPercentage(current, videoData.duration));
        setCurrentVideoTime(formatTime(current));
    };

    if (loadingVideo) {
        return (<Container className="max-w-6xl flex justify-center items-center">
            <CustomLoader />
        </Container>
        )
    }

    return (
        <Container className="max-w-5xl py-4 space-y-4">
            {videoData ? (
                <>
                    <div
                        ref={playerRef}
                        onMouseMove={showControlsTemporarily}
                        onTouchStart={showControlsTemporarily}
                        className='flex justify-center items-center aspect-video w-full mx-auto rounded-2xl shadow-[0_0_10px_rgba(0,0,0,0.1)] flex-col gap-4 bg-white relative'
                    >
                        <video
                            key={videoData._id}
                            src={videoData.videoFile}
                            className='w-full h-full rounded-2xl'
                            ref={videoRef}
                            preload="metadata"
                            autoPlay
                            muted
                            playsInline
                            controls={false}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                            onTimeUpdate={() => handleTimeUpdate(videoData)}
                        />
                        {/* Custom Controls */}
                        <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showCustomControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                            <div className={`relative bg-black/60 px-3 py-1.5 sm:py-3 text-white rounded-b-2xl `}>
                                <div className='flex items-center justify-between'>
                                    <div className="flex items-center gap-3">
                                        <button onClick={togglePlay} className='cursor-pointer'>
                                            {isPlaying ? <Pause className='w-4 sm:w-6' /> : <Play className='w-4 sm:w-6' />}
                                        </button>

                                        <button onClick={toggleMute} className='cursor-pointer'>
                                            {isMuted ? <VolumeX className='w-4 sm:w-6' /> : <Volume2 className='w-4 sm:w-6' />}
                                        </button>

                                        <button onClick={restartVideo} className='cursor-pointer'>
                                            <RotateCcw className='w-4 sm:w-6' />
                                        </button>

                                        <span className='text-sm sm:text-base'>
                                            {`${currentVideoTime}/${formatTime(videoData.duration)}`}
                                        </span>
                                    </div>

                                    <button onClick={handleFullscreen} className='cursor-pointer'>
                                        {
                                            fullscreen ? <Minimize className='w-4 sm:w-6' /> : <Maximize className='w-4 sm:w-6' />
                                        }
                                    </button>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className='absolute -top-1 sm:-top-1.5 bg-gray-400/25 h-1 sm:h-1.5 rounded-t-lg w-full z-40 cursor-pointer' ref={progressRef}
                                onClick={handleSeek}>
                                <div className="transition-all h-1 sm:h-1.5 rounded-r-full bg-[#4F46E5] ease-linear z-50 duration-250" style={{ width: `${videoPercentage}%` }}>
                                </div>
                            </div>
                        </div>
                        <div className='absolute top-1/2 left-2/3 -translate-y-1/2'>
                            <Image src="/forward_icon.png" alt="Forward Icon" width={50} height={50} className={`${forwardIcon ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`} />
                        </div>
                        <div className='absolute top-1/2 left-1/3 -translate-y-1/2'>
                            <Image src="/rewind_icon.png" alt="Rewind Icon" width={50} height={50} className={`${rewindIcon ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`} />
                        </div>
                    </div>
                    <div className='space-y-2'>
                        <h1 className='text-2xl font-extrabold text-[#1E293B]'>{videoData.title}</h1>
                        {/* Profile details */}
                        <div className='w-full flex gap-5 items-center'>
                            <div className='flex w-full max-w-[200px] items-center gap-2'>
                                <Image
                                    src={videoData.owner.avatar}
                                    alt={videoData.owner.username}
                                    width={45}
                                    height={45}
                                    className='rounded-full cursor-pointer'
                                    onClick={() => router.push(`/channel/${videoData.owner.username}`)}
                                />
                                <div>
                                    <p className='font-medium'>{videoData.owner.fullName}</p>
                                    <p className='text-sm text-gray-600'>{videoData.owner.subscribersCount} subscribers</p>
                                </div>
                            </div>
                            {
                                channelData && <SubscriptionForm isSubscribed={channelData.isSubscribed} channelId={channelData._id} />
                            }
                        </div>
                        <div className='ml-2 mt-4 flex gap-1 items-center'>
                            <LikeForm videoId={id} isLiked={videoData.isLiked} />
                            <span className='flex items-center text-[#1E293B] text-[14px] font-semibold'>{videoData.likesCount}</span>
                        </div>
                    </div>
                    <div className={`w-full text-sm text-[#475569] shadow-[0_10px_10px_rgba(0,0,0,0.1)] p-2 rounded-md space-y-1.5 ${videoData.description.length > 130 && "cursor-pointer"}`} onClick={() => setShowFullDescription(!showFullDescription)} >
                        {/* Views and upload date details */}
                        <div className='flex items-center gap-2 '>
                            <div className='flex items-center gap-1'>
                                <Image src="/views_icon.png" alt="Views" width={16} height={16} className='inline-block mr-1' />
                                <p>{videoData.views} views</p>
                            </div>
                            <span>|</span>
                            <p className=''>Uploaded: {formatDistanceToNow(new Date(videoData.createdAt), { addSuffix: true })}</p>
                        </div>
                        {/* Description */}
                        <p className='whitespace-pre-line' >
                            {showFullDescription || videoData.description.length <= 100
                                ? videoData.description
                                : `${videoData.description.substring(0, 100)}...`}
                            {
                                videoData.description.length > 100 && (
                                    <span className='text-blue-600 ml-1'>
                                        {showFullDescription ? ' Show less' : ' Read more'}
                                    </span>
                                )
                            }
                        </p>
                    </div>
                </>
            ) : (
                <div className='flex justify-center items-center aspect-video w-full max-w-4xl mx-auto rounded-2xl shadow-[0_0_10px_rgba(0,0,0,0.1)] flex-col gap-4 bg-white'>
                    <VideoOff className='w-16 h-16 text-gray-600' />
                    <p className='text-lg text-gray-600'>Video not found.</p>
                </div>
            )}

            <div className='w-full px-2 py-3'>
                <h2 className='text-base sm:text-[18px] font-bold text-[#1E293B]'>Comments &#40;{comments.length}&#41;</h2>
                <div className='mt-2'>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className='p-3 w-full rounded-lg flex flex-col gap-2 items-end border-[1px] bg-[#F8FAFC] border-[#E2E8F0]'>
                            <textarea id="comment" placeholder='Write your comment here...' rows={2} className='placeholder-[#1E293B] w-full text-[14px] outline-none' {...register("comment")}></textarea>
                            {
                                errors.comment && <p role="alert" className='text-red-500'>{errors.comment.message}</p>
                            }
                            <button type="submit" disabled={postingComment} className={``}>
                                {
                                    postingComment ? <Loader2 className='animate-spin' /> : <Image src={"/post_comment_button.png"} alt='Post Comment button' width={30} height={30} className='cursor-pointer hover:scale-105 transition-transform duration-200' />
                                }
                            </button>
                        </div>
                    </form>
                </div>

                <div className='w-full mt-3 space-y-3'>
                    {
                        loadingComments ? (
                            <div className='flex justify-center items-center'>
                                <Loader2 className='animate-spin' />
                            </div>
                        ) : comments.length > 0 ?
                            comments.map((comment) => (
                                <div key={comment._id} className='flex gap-3 items-start'>
                                    <div className='relative aspect-square w-[30px] sm:w-[40px] duration-150 rounded-full overflow-hidden mt-1'>
                                        <Image src={comment?.ownerDetails?.avatar || "/default_avatar.png"} alt='Avatar of the owner of comment' fill />
                                    </div>
                                    <div className='w-full py-1 px-2 flex gap-2'>
                                        <div className='space-y-1 grow'>
                                            <div className='flex w-full justify-between items-center'>
                                                <h3 className='text-[#1E293B] text-[14px] font-bold'>{comment.ownerDetails.fullName}</h3>
                                                <span className='text-[#475569] text-[12px]'>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                                            </div>
                                            <p className='text-[#475569] text-[14px]'>{comment.content}</p>
                                        </div>
                                        {
                                            isAuthenticated && user?._id === comment.ownerDetails._id && (
                                                <div className='relative'>
                                                    <EllipsisVertical className='w-4 h-4 mt-1 text-gray-600 cursor-pointer relative' />
                                                </div>
                                            )
                                        }

                                    </div>
                                </div>
                            ))
                            :
                            <p className='text-[#475569] text-[14px]'>No comments found.</p>
                    }
                </div>
            </div>
        </Container>
    )
}

export default VideoPlayer