"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchMarketingDataClient } from "../../src/lib/api";
import { MarketingData, Campaign } from "../../src/types/marketing";
import { Navbar } from "../../src/components/ui/navbar";
import { Footer } from "../../src/components/ui/footer";
import { BubbleMap } from "../../src/components/ui/bubble-map";
import { CardMetric } from "../../src/components/ui/card-metric";
import { MapPin, DollarSign, TrendingUp } from "lucide-react";

export default function RegionView() {
  const [data, setData] = useState<MarketingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const marketingData = await fetchMarketingDataClient();
        console.log("Fetched Marketing Data:", marketingData); // Debug
        setData(marketingData);
      } catch (error) {
        console.error("Failed to fetch marketing data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // City coordinates (hardcoded based on standard GPS data for GCC regions)
  const cityCoords: Record<string, { lat: number; lon: number }> = {
    "Abu Dhabi": { lat: 24.4539, lon: 54.3773 },
    Dubai: { lat: 25.2048, lon: 55.2708 },
    Sharjah: { lat: 25.3462, lon: 55.4211 },
    Riyadh: { lat: 24.7136, lon: 46.6753 },
    Doha: { lat: 25.2854, lon: 51.531 },
    "Kuwait City": { lat: 29.3759, lon: 47.9774 },
    Manama: { lat: 26.2235, lon: 50.5876 },
    Muscat: { lat: 23.588, lon: 58.3825 },
  };

  const regionalStats = useMemo(() => {
    if (!data?.campaigns) return null;

    const regionalAgg: Record<string, { revenue: number; spend: number }> = {};
    Object.keys(cityCoords).forEach((region) => {
      regionalAgg[region] = { revenue: 0, spend: 0 };
    });
    let topRegionByRevenue = { region: "N/A", revenue: 0 };

    data.campaigns.forEach((campaign: Campaign) => {
      campaign.regional_performance.forEach((region) => {
        if (!regionalAgg[region.region]) {
          regionalAgg[region.region] = { revenue: 0, spend: 0 };
        }
        regionalAgg[region.region].revenue += region.revenue;
        regionalAgg[region.region].spend += region.spend;

        if (regionalAgg[region.region].revenue > topRegionByRevenue.revenue) {
          topRegionByRevenue = {
            region: region.region,
            revenue: regionalAgg[region.region].revenue,
          };
        }
      });
    });

    // Prepare separate data for Revenue and Spend maps
    const bubbleDataRevenue = Object.entries(regionalAgg)
      .filter(([region]) => cityCoords[region])
      .map(([region, values]) => ({
        region,
        lat: cityCoords[region].lat,
        lon: cityCoords[region].lon,
        revenue: values.revenue,
        spend: values.spend, // Included for tooltip consistency
      }));

    const bubbleDataSpend = Object.entries(regionalAgg)
      .filter(([region]) => cityCoords[region])
      .map(([region, values]) => ({
        region,
        lat: cityCoords[region].lat,
        lon: cityCoords[region].lon,
        revenue: values.revenue, // Included for tooltip consistency
        spend: values.spend,
      }));

    return {
      bubbleDataRevenue,
      bubbleDataSpend,
      topRegionByRevenue: topRegionByRevenue.region,
      totalRegions: Object.keys(regionalAgg).length,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!data || !regionalStats) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        Failed to load regional data. Please try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900">
      <Navbar className="h-auto lg:h-screen flex-shrink-0" />
      <main className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-8 sm:py-12">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                Regional Performance
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Visualizing campaign spend and revenue across key regions in the
                GCC.
              </p>
            </div>
          </div>
        </section>
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto w-full max-w-full">
          <section className="mb-6 sm:mb-8 mx-auto">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 mx-auto">
              <CardMetric
                title="Top Region by Revenue"
                value={regionalStats.topRegionByRevenue}
                icon={<MapPin className="h-6 w-6 text-rose-500" />}
              />
              <CardMetric
                title="Total Regions"
                value={regionalStats.totalRegions}
                icon={<MapPin className="h-6 w-6 text-rose-500" />}
              />
            </div>
          </section>
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <BubbleMap
              title="Revenue by Region"
              data={regionalStats.bubbleDataRevenue}
              valueType="revenue"
              className="bg-gray-800 text-white"
              height={400}
            />
            <BubbleMap
              title="Spend by Region"
              data={regionalStats.bubbleDataSpend}
              valueType="spend"
              className="bg-gray-800 text-white"
              height={400}
            />
          </section>
        </div>
        <Footer />
      </main>
    </div>
  );
}
