import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { useState } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { DeployWorkerDialog } from '@/components/interfaces/Workers/DeployWorkerDialog'
import { WorkersEmptyState } from '@/components/interfaces/Workers/WorkersEmptyState'
import { WorkersList } from '@/components/interfaces/Workers/WorkersList'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { WorkersLayout } from '@/components/layouts/WorkersLayout/WorkersLayout'
import { AlertError } from '@/components/ui/AlertError'
import { workersQueryOptions } from '@/data/workers/workers-query'
import { PRODUCT_NAME } from '@/lib/constants/workers'
import type { NextPageWithLayout } from '@/types'

const WorkersPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const [showDeployInstructions, setShowDeployInstructions] = useState(false)
  const {
    data: workers,
    error,
    isPending,
    isError,
    isSuccess,
  } = useQuery(workersQueryOptions({ projectRef: ref }))

  return (
    <div className="w-full min-h-full flex flex-col items-stretch">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{PRODUCT_NAME}</PageHeaderTitle>
            <PageHeaderDescription>
              Run backend workers in microVMs next to your database
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            {isPending && <GenericSkeletonLoader />}
            {isError && <AlertError error={error} subject="Failed to retrieve workers" />}
            {isSuccess && workers.length === 0 && (
              <WorkersEmptyState onDeploy={() => setShowDeployInstructions(true)} />
            )}
            {isSuccess && workers.length > 0 && ref && (
              <WorkersList
                projectRef={ref}
                workers={workers}
                onDeploy={() => setShowDeployInstructions(true)}
              />
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <DeployWorkerDialog open={showDeployInstructions} onOpenChange={setShowDeployInstructions} />
    </div>
  )
}

WorkersPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkersLayout title={PRODUCT_NAME}>{page}</WorkersLayout>
  </DefaultLayout>
)

export default WorkersPage
