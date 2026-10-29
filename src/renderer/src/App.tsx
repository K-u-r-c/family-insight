import { useApplyTheme } from './hooks/useApplyTheme'
import { WelcomeScreen } from './components/WelcomeScreen'

export function App(): React.JSX.Element {
  useApplyTheme()
  return <WelcomeScreen />
}
