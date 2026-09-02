import { Suspense } from "react";
import { airports, terminals, zones, equipment } from "@/lib/mock-data";
import { LocationClient } from "./LocationClient";

export default function LocationPage() {
  return (
    <Suspense>
      <LocationClient airports={airports} terminals={terminals} zones={zones} equipment={equipment} />
    </Suspense>
  );
}
