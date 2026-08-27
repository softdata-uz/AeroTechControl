"use client";

import dynamic from "next/dynamic";

// ApexCharts touches `window` at import time, so it must never be part of
// the SSR bundle — dynamic + ssr:false is the standard Next.js escape
// hatch, and every chart component here imports this instead of
// react-apexcharts directly.
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default ReactApexChart;
