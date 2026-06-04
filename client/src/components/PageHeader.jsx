import { useNavigate } from 'react-router-dom'
import PageTitleBar from './PageTitleBar'

export default function PageHeader({ title, subtitle, onBack, right = null }) {
  const navigate = useNavigate()
  const handleBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <PageTitleBar
      title={title}
      subtitle={subtitle}
      onBack={handleBack}
      right={right}
    />
  )
}
