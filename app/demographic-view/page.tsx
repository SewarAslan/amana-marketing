"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchMarketingDataClient } from "../../src/lib/api";
import { MarketingData } from "../../src/types/marketing";
import { Navbar } from "../../src/components/ui/navbar";
import { Footer } from "../../src/components/ui/footer";
import { CardMetric } from "../../src/components/ui/card-metric";
import { BarChart } from "../../src/components/ui/bar-chart";
import { Table } from "../../src/components/ui/table";
import { Users, DollarSign, TrendingUp, MousePointerClick } from "lucide-react";

export default function DemographicView() {
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

  // Memoized calculation for all demographic statistics
  const demographicStats = useMemo(() => {
    if (!data?.campaigns) return null;

    const stats = {
      male: { clicks: 0, spend: 0, revenue: 0 },
      female: { clicks: 0, spend: 0, revenue: 0 },
      byAgeGroup: {} as Record<string, { spend: number; revenue: number }>,
    };

    const performanceByAgeGender: Record<
      string,
      Record<
        string,
        { impressions: number; clicks: number; conversions: number }
      >
    > = {};

    data.campaigns.forEach((campaign) => {
      const spendPerClick =
        campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0;
      const revenuePerConversion =
        campaign.conversions > 0 ? campaign.revenue / campaign.conversions : 0;

      campaign.demographic_breakdown.forEach((breakdown) => {
        const estimatedSpend = breakdown.performance.clicks * spendPerClick;
        const estimatedRevenue =
          breakdown.performance.conversions * revenuePerConversion;

        // Aggregate for Card Metrics
        if (breakdown.gender === "Male") {
          stats.male.clicks += breakdown.performance.clicks;
          stats.male.spend += estimatedSpend;
          stats.male.revenue += estimatedRevenue;
        } else if (breakdown.gender === "Female") {
          stats.female.clicks += breakdown.performance.clicks;
          stats.female.spend += estimatedSpend;
          stats.female.revenue += estimatedRevenue;
        }

        // Initialize age group if not present for table aggregation
        if (!performanceByAgeGender[breakdown.age_group]) {
          performanceByAgeGender[breakdown.age_group] = {
            Male: { impressions: 0, clicks: 0, conversions: 0 },
            Female: { impressions: 0, clicks: 0, conversions: 0 },
          };
        }

        // Aggregate performance for Tables
        if (breakdown.gender in performanceByAgeGender[breakdown.age_group]) {
          performanceByAgeGender[breakdown.age_group][
            breakdown.gender
          ].impressions += breakdown.performance.impressions;
          performanceByAgeGender[breakdown.age_group][
            breakdown.gender
          ].clicks += breakdown.performance.clicks;
          performanceByAgeGender[breakdown.age_group][
            breakdown.gender
          ].conversions += breakdown.performance.conversions;
        }

        // Initialize age group for bar chart aggregation
        if (!stats.byAgeGroup[breakdown.age_group]) {
          stats.byAgeGroup[breakdown.age_group] = { spend: 0, revenue: 0 };
        }

        // Aggregate for Bar Charts
        stats.byAgeGroup[breakdown.age_group].spend += estimatedSpend;
        stats.byAgeGroup[breakdown.age_group].revenue += estimatedRevenue;
      });
    });

    const maleTableData = Object.entries(performanceByAgeGender).map(
      ([age_group, genders]) => ({
        age_group,
        ...genders.Male,
        ctr:
          genders.Male.impressions > 0
            ? (genders.Male.clicks / genders.Male.impressions) * 100
            : 0,
        conversion_rate:
          genders.Male.clicks > 0
            ? (genders.Male.conversions / genders.Male.clicks) * 100
            : 0,
      })
    );

    const femaleTableData = Object.entries(performanceByAgeGender).map(
      ([age_group, genders]) => ({
        age_group,
        ...genders.Female,
        ctr:
          genders.Female.impressions > 0
            ? (genders.Female.clicks / genders.Female.impressions) * 100
            : 0,
        conversion_rate:
          genders.Female.clicks > 0
            ? (genders.Female.conversions / genders.Female.clicks) * 100
            : 0,
      })
    );

    return { ...stats, maleTableData, femaleTableData };
  }, [data]);

  // Format data for Bar Chart components
  const spendByAgeData = useMemo(() => {
    if (!demographicStats?.byAgeGroup) return [];
    return Object.entries(demographicStats.byAgeGroup)
      .map(([age, data]) => ({ label: age, value: data.spend }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [demographicStats]);

  const revenueByAgeData = useMemo(() => {
    if (!demographicStats?.byAgeGroup) return [];
    return Object.entries(demographicStats.byAgeGroup)
      .map(([age, data]) => ({ label: age, value: data.revenue }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [demographicStats]);

  // Define columns for the performance tables
  const tableColumns = [
    {
      key: "age_group",
      header: "Age Group",
      sortable: true,
      sortType: "string" as const,
      width: "20%",
    },
    {
      key: "impressions",
      header: "Impressions",
      sortable: true,
      sortType: "number" as const,
      render: (val: number) => val.toLocaleString(),
      align: "right" as const,
    },
    {
      key: "clicks",
      header: "Clicks",
      sortable: true,
      sortType: "number" as const,
      render: (val: number) => val.toLocaleString(),
      align: "right" as const,
    },
    {
      key: "conversions",
      header: "Conversions",
      sortable: true,
      sortType: "number" as const,
      render: (val: number) => val.toLocaleString(),
      align: "right" as const,
    },
    {
      key: "ctr",
      header: "CTR",
      sortable: true,
      sortType: "number" as const,
      render: (val: number) => `${val.toFixed(2)}%`,
      align: "right" as const,
    },
    {
      key: "conversion_rate",
      header: "CVR",
      sortable: true,
      sortType: "number" as const,
      render: (val: number) => `${val.toFixed(2)}%`,
      align: "right" as const,
    },
  ];

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

  if (!data || !demographicStats) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        Failed to load demographic data. Please try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900">
      <Navbar className="h-auto lg:h-screen flex-shrink-0" />
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-8 sm:py-12">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                Demographic Performance
              </h1>
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto w-full max-w-full">
          {/* Male Performance Metrics */}
          <section className="mb-6 sm:mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Male Audience
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <CardMetric
                title="Total Clicks by Males"
                value={demographicStats.male.clicks.toLocaleString()}
                icon={<MousePointerClick className="h-6 w-6 text-blue-500" />}
              />
              <CardMetric
                title="Total Spend on Males"
                value={`$${demographicStats.male.spend.toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}`}
                icon={<DollarSign className="h-6 w-6 text-green-500" />}
              />
              <CardMetric
                title="Total Revenue from Males"
                value={`$${demographicStats.male.revenue.toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}`}
                icon={<TrendingUp className="h-6 w-6 text-emerald-500" />}
              />
            </div>
          </section>

          {/* Female Performance Metrics */}
          <section className="mb-4 sm:mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Female Audience
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <CardMetric
                title="Total Clicks by Females"
                value={demographicStats.female.clicks.toLocaleString()}
                icon={<MousePointerClick className="h-6 w-6 text-pink-500" />}
              />
              <CardMetric
                title="Total Spend on Females"
                value={`$${demographicStats.female.spend.toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}`}
                icon={<DollarSign className="h-6 w-6 text-green-500" />}
              />
              <CardMetric
                title="Total Revenue from Females"
                value={`$${demographicStats.female.revenue.toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}`}
                icon={<TrendingUp className="h-6 w-6 text-emerald-500" />}
              />
            </div>
          </section>

          {/* Performance by Age Group Charts */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <BarChart
              title="Total Spend by Age Group"
              data={spendByAgeData}
              showValues={true}
              formatValue={(value) => `$${(value / 1000).toFixed(1)}k`}
            />
            <BarChart
              title="Total Revenue by Age Group"
              data={revenueByAgeData}
              showValues={true}
              formatValue={(value) => `$${(value / 1000).toFixed(1)}k`}
            />
          </section>

          {/* Performance Tables */}
          <section className="overflow-x-auto w-full max-w-full">
            <Table
              title="Campaign Performance by Male Age Groups"
              columns={tableColumns}
              data={demographicStats.maleTableData}
              defaultSort={{ key: "age_group", direction: "asc" }}
            />
            <Table
              title="Campaign Performance by Female Age Groups"
              columns={tableColumns}
              data={demographicStats.femaleTableData}
              defaultSort={{ key: "age_group", direction: "asc" }}
            />
          </section>
        </div>
        <Footer />
      </main>
    </div>
  );
}
