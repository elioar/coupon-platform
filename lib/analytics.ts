export async function trackCouponEvent(
  couponId: string,
  eventType: "VIEW" | "CLICK" | "REDEMPTION" | "SAVE",
  userId?: string
) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        couponId,
        eventType,
        userId,
      }),
    })
  } catch (error) {
    console.error("Failed to track event:", error)
    // Fail silently - don't break user experience
  }
}

