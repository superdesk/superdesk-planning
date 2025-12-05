# Running Playwright using Distrobox
To set up Playwright using Distrobox, you will create an isolated Ubuntu container, which Playwright officially supports, and then install Playwright and its dependencies within that container.

## Step 1: Install Distrobox on your host machine
First, ensure you have distrobox and podman (or docker) installed on your host Linux distribution. Installation methods vary by distro; for Fedora, you would use:

```bash
sudo dnf install distrobox podman
````

> [!NOTE]
> For other distributions, refer to the official Distrobox documentation for installation instructions.

## Step 2: Create a dedicated directory for containers
It is recommended to store your container home directories separately from your host's home directory to keep things organized.

```bash
mkdir ~/distrobox
```

## Step 3: Create the Playwright container
Create a new container using an Ubuntu image (e.g., ubuntu:24.04) and set its home directory to the path you just created. The command below also installs essential packages like Git and Node.js automatically.
```bash
distrobox create \
--name ubuntu-playwright \
--image ubuntu:24.04 \
--home ~/distrobox/ubuntu-playwright \
--additional-packages "git vim nodejs npm"
```

> [!NOTE]
> The first time you run this, it will download the Ubuntu image and other dependencies, which may take some time.

## Step 4: Enter the container
Enter the newly created container environment with the following command:

```bash
distrobox enter ubuntu-playwright
```

Your current terminal session will now be operating within the Ubuntu container environment.

## Step 5: Install Playwright within the container
Once inside the container, you can set up your Node.js project and install Playwright using npm.

Install Playwright in that directory:
```bash
cd e2e
npx playwright install --with-deps chromium
```

The npx playwright install command will download the Chromium binaries.

## Step 6: Run your tests
You can now run your Playwright tests from within the container using standard Playwright CLI commands, for example:
```bash
npm run playwright
```

To run tests in headed mode (with the browser GUI visible), use the --headed flag.
```bash
npm run playwright-interactive
```
