'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// SwaggerUI requires browser environment, dynamically import it with SSR disabled
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="bg-white min-h-screen">
      <SwaggerUI url="/openapi.json" />
    </div>
  );
}
