import Head from "next/head";
import styles from "../styles/Home.module.css";
import { csv } from "d3";
import { useEffect, useMemo, useState } from "react";
import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  LineSeries,
  VerticalGridLines,
  VerticalBarSeries,
  RadialChart,
} from "react-vis";

export default function Home() {
  const [offerLookup, setOfferLookup] = useState([]);
  const [offerHistory, setOfferHistory] = useState([]);

  const dataInfo = useMemo(() => {
    return offerHistory.reduce(
      (acm, offer) => {
        const newAcm = { ...acm };
        newAcm.total++;

        const additionalValue = offer.is_repeater === "1" ? 50 : 0;
        const offerValue =
          -Number(
            offerLookup.find(
              (offerLook) => offer.offer_id === offerLook.offer_id
            )?.offervalue
          ) + additionalValue;

        if (offer.in_controlgroup === "1") {
          newAcm.controlCLV += offerValue;
        } else {
          newAcm.experimentalCLV += offerValue;
        }

        if (offer.is_repeater === "1") {
          if (offer.in_controlgroup === "1") {
            newAcm.controlRepeaters++;
          } else {
            newAcm.experimentalRepeaters++;
          }
        }

        return newAcm;
      },
      {
        controlCLV: 0,
        experimentalCLV: 0,
        total: 0,
        experimentalRepeaters: 0,
        controlRepeaters: 0,
      }
    );
  }, [offerHistory, offerLookup]);

  useEffect(() => {
    async function fetchingDataCsv() {
      const offerLookupData = await csv("/data/offer_lookup.csv");
      setOfferLookup(offerLookupData);

      const offerHistoryData = await csv("/data/offer_history.csv");
      setOfferHistory(offerHistoryData);
    }

    fetchingDataCsv();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>OfferFit Test</title>
        <meta name="description" content="OfferFit full stack assignment" />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/react-vis/dist/style.css"
        />
      </Head>

      <main className={styles.main}>
        <h1>Customer Analysis</h1>
        <p>{"2021-04-30"}</p>
        <p>Total offers sent to date: {dataInfo.total}</p>
        <p>Total repeaters</p>
        <RadialChart
          showLabels={true}
          data={[
            {
              label: "Control",
              subLabel: dataInfo.controlRepeaters,
              angle: dataInfo.controlRepeaters,
            },
            {
              label: "Experimental",
              subLabel: dataInfo.experimentalRepeaters,
              angle: dataInfo.experimentalRepeaters,
            },
          ]}
          width={300}
          height={300}
        />
        <p>Total CLV (experiment group vs. control) to date</p>
        <XYPlot
          margin={{ bottom: 70 }}
          xType="ordinal"
          width={300}
          height={300}
        >
          <VerticalGridLines />
          <HorizontalGridLines />
          <XAxis />
          <YAxis
            tickFormat={(v, i, scale, tickTotal) => {
              return `$${scale.tickFormat(tickTotal, "s")(v)}k`;
            }}
          />
          <VerticalBarSeries
            data={[
              { x: "Experiment group", y: dataInfo.experimentalCLV / 1000 },
              { x: "Control group", y: dataInfo.controlCLV / 1000 },
            ]}
          />
        </XYPlot>
      </main>
    </div>
  );
}
