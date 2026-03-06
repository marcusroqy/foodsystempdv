import app from './app';
import { runMigrations } from './migrations';

const PORT = process.env.PORT || 3333;

// Run migrations before starting the server
runMigrations().then(() => {
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
});
