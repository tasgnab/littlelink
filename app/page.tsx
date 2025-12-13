import LandingPage from "@/components/LandingPage";
import { db } from "@/lib/db";
import { links, tags, linkTags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface LinktreeLink {
  shortCode: string;
  originalUrl: string;
  title: string | null;
}

async function getPublicLinks(): Promise<LinktreeLink[]> {
  try {
    // Find the "littlelink" tag
    const littlelinkTag = await db
      .select()
      .from(tags)
      .where(eq(tags.name, "littlelink"))
      .limit(1);

    if (littlelinkTag.length === 0) {
      return [];
    }

    const tagId = littlelinkTag[0].id;

    // Get all links with the "littlelink" tag that are active
    const linksWithTag = await db
      .select({
        shortCode: links.shortCode,
        originalUrl: links.originalUrl,
        title: links.title,
      })
      .from(links)
      .innerJoin(linkTags, eq(links.id, linkTags.linkId))
      .where(
        and(
          eq(linkTags.tagId, tagId),
          eq(links.isActive, true)
        )
      );

    return linksWithTag;
  } catch (error) {
    console.error("Error fetching public links:", error);
    return [];
  }
}

// Enable ISR with revalidation every 60 seconds
export const revalidate = 60;

export default async function Home() {
  const links = await getPublicLinks();

  return <LandingPage links={links} />;
}
