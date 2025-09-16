"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchMarketingDataClient } from "../../src/lib/api";
import { MarketingData, Campaign } from "../../src/types/marketing";
import { Navbar } from "../../src/components/ui/navbar";
import { Footer } from "../../src/components/ui/footer";
import { CardMetric } from "../../src/components/ui/card-metric";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, Smartphone, Monitor } from "lucide-react";

export default function DeviceView() {
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

  const deviceStats = useMemo(() => {
    if (!data?.campaigns) return null;

    const deviceAgg: Record<string, { revenue: number; spend: number }> = {
      Desktop: { revenue: 0, spend: 0 },
      Mobile: { revenue: 0, spend: 0 },
    };

    data.campaigns.forEach((campaign: Campaign) => {
      campaign.device_performance.forEach((device) => {
        const deviceType = device.device;
        if (deviceAgg[deviceType]) {
          deviceAgg[deviceType].revenue += device.revenue;
          deviceAgg[deviceType].spend += device.spend;
        }
      });
    });

    const chartData = [
      {
        name: "Desktop",
        revenue: deviceAgg.Desktop.revenue,
        spend: deviceAgg.Desktop.spend,
      },
      {
        name: "Mobile",
        revenue: deviceAgg.Mobile.revenue,
        spend: deviceAgg.Mobile.spend,
      },
    ];

    return {
      chartData,
      totalRevenue: deviceAgg.Desktop.revenue + deviceAgg.Mobile.revenue,
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

  if (!data || !deviceStats) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        Failed to load device data. Please try again later.
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
                Device Performance
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Comparing campaign performance across Desktop and Mobile.
              </p>
            </div>
          </div>
        </section>
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto w-full max-w-full">
          <section className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <CardMetric
                title="Total Revenue"
                value={`$${deviceStats.totalRevenue.toLocaleString()}`}
                icon={<DollarSign className="h-6 w-6 text-green-500" />}
              />
              <CardMetric
                title="Desktop Revenue"
                value={`$${deviceStats.chartData[0].revenue.toLocaleString()}`}
                icon={<Monitor className="h-6 w-6 text-blue-500" />}
              />
              <CardMetric
                title="Mobile Revenue"
                value={`$${deviceStats.chartData[1].revenue.toLocaleString()}`}
                icon={<Smartphone className="h-6 w-6 text-purple-500" />}
              />
            </div>
          </section>
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px] bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 text-white">
                Revenue by Device
              </h2>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deviceStats.chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#333",
                      border: "none",
                      borderRadius: "4px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend wrapperStyle={{ color: "#ccc" }} />
                  <Bar
                    dataKey="revenue"
                    fill="#82ca9d"
                    name="Revenue"
                    barSize={40}
                    minPointSize={5}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[400px] bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 text-white">
                Spend by Device
              </h2>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deviceStats.chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#333",
                      border: "none",
                      borderRadius: "4px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend wrapperStyle={{ color: "#ccc" }} />
                  <Bar
                    dataKey="spend"
                    fill="#ff7300"
                    name="Spend"
                    barSize={40}
                    minPointSize={5}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
        <Footer />
      </main>
    </div>
  );
}
