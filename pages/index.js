import styled from "styled-components";
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
    <Main>
      <Container>
        <Header>
          <Title>Offers Analysis</Title>
          <Date>{"2021-04-30"}</Date>
        </Header>
        <Wrapper>
          <Card>
            <div>
              <CardTitle>Total offers sent to date</CardTitle>
              <CardTotal>{dataInfo.total}</CardTotal>
            </div>
          </Card>
          <Card>
            <CardTitle>Total repeaters</CardTitle>
            <RadialChart
              showLabels={true}
              data={[
                {
                  label: "Control",
                  subLabel: `total: ${dataInfo.controlRepeaters}`,
                  angle: dataInfo.controlRepeaters,
                },
                {
                  label: "Experimental",
                  subLabel: `total: ${dataInfo.experimentalRepeaters}`,
                  angle: dataInfo.experimentalRepeaters,
                },
              ]}
              width={300}
              height={300}
            />
          </Card>
          <Card>
            <CardTitle>Total CLV</CardTitle>
            <XYPlot xType="ordinal" width={300} height={300}>
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
          </Card>
        </Wrapper>
      </Container>
    </Main>
  );
}

const Container = styled.div`
  padding: 0 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Main = styled.main`
  min-height: 100vh;
  position: relative;
  margin: 0;

  &:after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 25vw;
    background: linear-gradient(
      to left,
      rgba(20, 20, 20, 0.15),
      rgba(0, 0, 0, 0)
    );
  }
`;

const Header = styled.header`
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const Date = styled.p`
  font-size: 1.2rem;
  margin-right: 1rem;
  color: #888888;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #888888;
  text-transform: uppercase;
  padding: 1rem 0;
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin: 2rem auto;
`;

const Card = styled.div`
  padding: 1rem;
  border-radius: 0.25rem;
  background: #ffffff;
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
  display: grid;
  place-items: center;
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: bold;
  color: #888888;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  max-width: 300px;
  text-align: center;
`;

const CardTotal = styled.p`
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  color: #aaaaaa;
  text-decoration: underline;
`;
