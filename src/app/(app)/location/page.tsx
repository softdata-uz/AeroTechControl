import { airports, terminals, zones, equipment } from "@/lib/mock-data";
import { LocationClient } from "./LocationClient";

export default function LocationPage() {
  return (
    <LocationClient airports={airports} terminals={terminals} zones={zones} equipment={equipment} />
  );
}
