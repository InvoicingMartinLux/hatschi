import { I18nProvider } from "@/components/I18nProvider";
import AllergyScreen from "@/components/AllergyScreen";

export default function Home() {
  return (
    <I18nProvider>
      <AllergyScreen />
    </I18nProvider>
  );
}
