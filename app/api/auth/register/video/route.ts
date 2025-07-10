import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { IVideo, Video } from "@/models/Video";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Handle GET request: Return all videos sorted by newest first
export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all videos, sort by creation date (latest first), and return as plain JS objects
    const videos = await Video.find({}).sort({ createdAt: -1 }).lean();

    // If no videos found, return empty array
    if (!videos || videos.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Return the video list as JSON
    return NextResponse.json(videos);
  } catch {
    // If any error occurs, return error response
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

// Handle POST request: Create a new video
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body into a video object
    const body: IVideo = await request.json();

    // Validate required fields
    if (!body.title || !body.description || !body.videoUrl || !body.thumbnailUrl) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Prepare video data with defaults
    const videoData = {
      ...body,
      controls: body.controls ?? true, // Default to true if not provided
      transformation: {
        height: 1920,
        width: 1080,
        quality: body.transformation?.quality ?? 80, // Default to 80 if not provided
      },
    };

    // Save new video in the database
    const newVideo = await Video.create(videoData);

    // Return the newly created video as JSON
    return NextResponse.json(newVideo);
  } catch{
    // Handle server errors
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
