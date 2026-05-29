import { useRouter } from 'expo-router';
import { AppButton, Message, Screen, ScreenTitle } from '../components/Primitives';
import { RouteSummaryCard } from '../components/RouteCards';
import { useWalkApp } from '../state/WalkAppContext';

export function CompareScreen() {
  const router = useRouter();
  const { error, routeSummaries, openRouteDetail } = useWalkApp();

  return (
    <Screen>
      <ScreenTitle title="Nearby loops" detail={`${routeSummaries.length} options near your start point`} />
      {error ? <Message type="error" text={error} /> : null}
      {routeSummaries.length === 0 ? (
        <>
          <Message type="warning" text="No matching loops yet. Try a shorter goal, fewer interests, or a broader Montreal start point." />
          <AppButton title="Adjust walk" onPress={() => router.replace('/(tabs)')} />
        </>
      ) : routeSummaries.map((route, index) => (
        <RouteSummaryCard
          key={route.id}
          route={route}
          index={index}
          onPress={() => void openRouteDetail(route.id).then((ok) => {
            if (ok) router.push('/detail');
          })}
        />
      ))}
    </Screen>
  );
}
