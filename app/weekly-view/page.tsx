"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchMarketingDataClient } from "../../src/lib/api";
import { MarketingData } from "../../src/types/marketing";
import { Navbar } from "../../src/components/ui/navbar";
import { Footer } from "../../src/components/ui/footer";
import { LineChart } from "../../src/components/ui/line-chart";
import { CardMetric } from "../../src/components/ui/card-metric";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

export default function WeeklyView() {
  const [data, setData] = useState<MarketingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const marketingData = await fetchMarketingDataClient();
        setData(marketingData);
      } catch (error) {
        console.error("Failed to fetch marketing data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const weeklyStats = useMemo(() => {
    if (!data?.campaigns) return null;

    const weeklyAgg: Record<string, { revenue: number; spend: number }> = {};
    let totalRevenue = 0;
    let totalSpend = 0;

    data.campaigns.forEach((campaign) => {
      campaign.weekly_performance.forEach((week) => {
        if (!weeklyAgg[week.week_start]) {
          weeklyAgg[week.week_start] = { revenue: 0, spend: 0 };
        }
        weeklyAgg[week.week_start].revenue += week.revenue;
        weeklyAgg[week.week_start].spend += week.spend;
      });
    });

    const sortedWeeks = Object.keys(weeklyAgg).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const revenueByWeek = sortedWeeks.map((weekStart) => {
      totalRevenue += weeklyAgg[weekStart].revenue;
      return { x: weekStart, y: weeklyAgg[weekStart].revenue };
    });

    const spendByWeek = sortedWeeks.map((weekStart) => {
      totalSpend += weeklyAgg[weekStart].spend;
      return { x: weekStart, y: weeklyAgg[weekStart].spend };
    });

    const totalWeeks = sortedWeeks.length;
    const averageWeeklyRevenue = totalWeeks > 0 ? totalRevenue / totalWeeks : 0;
    const averageWeeklySpend = totalWeeks > 0 ? totalSpend / totalWeeks : 0;

    return {
      revenueByWeek,
      spendByWeek,
      totalWeeks,
      averageWeeklyRevenue,
      averageWeeklySpend,
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

  if (!data || !weeklyStats) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        Failed to load weekly data. Please try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900">
      <Navbar className="h-auto lg:h-screen flex-shrink-0" />
      <main className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-8 sm:py-12">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                Weekly Performance
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                A breakdown of marketing performance on a week-by-week basis.
              </p>
            </div>
          </div>
        </section>
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto w-full max-w-full">
          <section className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <CardMetric
                title="Total Weeks Tracked"
                value={weeklyStats.totalWeeks.toString()}
                icon={<Calendar className="h-6 w-6 text-indigo-500" />}
              />
              <CardMetric
                title="Average Weekly Spend"
                value={`$${weeklyStats.averageWeeklySpend.toLocaleString(
                  undefined,
                  { maximumFractionDigits: 0 }
                )}`}
                icon={<DollarSign className="h-6 w-6 text-green-500" />}
              />
              <CardMetric
                title="Average Weekly Revenue"
                value={`$${weeklyStats.averageWeeklyRevenue.toLocaleString(
                  undefined,
                  { maximumFractionDigits: 0 }
                )}`}
                icon={<TrendingUp className="h-6 w-6 text-emerald-500" />}
              />
            </div>
          </section>
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <LineChart
              title="Revenue by Week"
              data={weeklyStats.revenueByWeek}
              strokeColor="#10b981" // emerald-500
              fillColor="rgba(16, 185, 129, 0.1)"
              formatYLabel={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <LineChart
              title="Spend by Week"
              data={weeklyStats.spendByWeek}
              strokeColor="#ef4444" // red-500
              fillColor="rgba(239, 68, 68, 0.1)"
              formatYLabel={(value) =>
                `$${value.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`
              }
            />
          </section>
        </div>
        <Footer />
      </main>
    </div>
  );
}
