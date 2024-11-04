"use server";

import React from 'react';
import BillingDashboard from '../../../components/billing-dashboard/BillingDashboard';
import { getServices } from '../../../lib/actions/serviceActions';
import { fetchAllTimePeriods } from '../../../lib/actions/timePeriodsActions';

const BillingPage = async () => {
  console.log('Fetching all time periods, services, tenants, and invoices');
  const [timePeriods, services] = await Promise.all([
    fetchAllTimePeriods(),
    getServices()
  ]);

  return (
    <BillingDashboard 
      initialTimePeriods={timePeriods}
      initialServices={services}
    />
  );
};

export default BillingPage;
