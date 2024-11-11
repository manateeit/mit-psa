try {
  // This import will trigger validation
  import('../lib/init/serverInit').then(() => {
    console.log('Environment variables validated successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('Environment validation failed:');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  });
} catch (error) {
  console.error('Environment validation failed:');
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
}
