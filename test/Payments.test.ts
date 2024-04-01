import { ethers, loadFixture, expect } from "./setup";

describe("Payments", () => {
	async function deploy() {
		const [user1, user2] = await ethers.getSigners();
		const Factory = await ethers.getContractFactory("Payments");
		const payments = await Factory.deploy();
		await payments.waitForDeployment();

		return { user1, user2, payments };
	}

	it("should be deployed", async () => {
		const { payments } = await loadFixture(deploy);
		expect(payments.target).to.be.properAddress;
	});

	it("should have 0 ethers by default", async () => {
		const { payments } = await loadFixture(deploy);
		// @NOTE: if smart contract don't have fn getBalance
		// const balance = await ethers.provider.getBalance(payments.target);
		const balance = await payments.currentBalance();
		expect(balance).to.eq(0);
	});

	it("should be possible to send funds from first user", async () => {
		const { payments, user1 } = await loadFixture(deploy);
		const sum = 100; // wei
		const msg = "Hello from Hardhat One";

		const tx = await payments.pay(msg, { value: sum });
		await tx.wait(1);

		const currentBalance = await ethers.provider.getBlock(
			await ethers.provider.getBlockNumber(),
		);

		await expect(tx).to.changeEtherBalance(user1, -sum);
		const newPayment = await payments.getPayment(user1.address, 0);
		expect(newPayment.message).to.eq(msg);
		expect(newPayment.amount).to.eq(sum);
		expect(newPayment.from).to.eq(user1.address);
		expect(newPayment.timestamp).to.eq(currentBalance?.timestamp);
	});

	it("should be possible to send funds from of the second user", async () => {
		const { payments, user2 } = await loadFixture(deploy);
		const sum = 100; // wei
		const msg = "Hello from Hardhat Two";

		const tx = await payments.connect(user2).pay(msg, { value: sum });
		await tx.wait(1);

		const currentBalance = await ethers.provider.getBlock(
			await ethers.provider.getBlockNumber(),
		);

		await expect(tx).to.changeEtherBalance(user2, -sum);
		const newPayment = await payments.getPayment(user2.address, 0);
		expect(newPayment.message).to.eq(msg);
		expect(newPayment.amount).to.eq(sum);
		expect(newPayment.from).to.eq(user2.address);
		expect(newPayment.timestamp).to.eq(currentBalance?.timestamp);
	});
});
