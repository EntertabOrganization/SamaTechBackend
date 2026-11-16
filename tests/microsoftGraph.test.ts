import { createMicrosoftMeeting, sendMicrosoftMail } from "../src/lib/microsoftGraph";

describe("Microsoft Graph integration", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeAll(() => {
    Object.assign(process.env, { NODE_ENV: "development", MICROSOFT_TENANT_ID: "tenant", MICROSOFT_CLIENT_ID: "client", MICROSOFT_CLIENT_SECRET: "secret", MICROSOFT_MAILBOX: "staff@example.com" });
    global.fetch = fetchMock as unknown as typeof fetch;
  });
  afterAll(() => { process.env = originalEnv; global.fetch = originalFetch; });

  it("sends HTML mail through the configured mailbox with reply-to", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "token", expires_in: 3600 }) });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 202 });
    await sendMicrosoftMail({ to: "customer@example.com", subject: "Hello", html: "<b>Hello</b>", replyTo: "reply@example.com" });
    expect(fetchMock.mock.calls[1][0]).toContain("/users/staff%40example.com/sendMail");
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.message.toRecipients[0].emailAddress.address).toBe("customer@example.com");
    expect(body.message.replyTo[0].emailAddress.address).toBe("reply@example.com");
  });

  it("creates a UTC event and returns its Teams join URL", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ onlineMeeting: { joinUrl: "https://teams.example/meeting" } }) });
    await expect(createMicrosoftMeeting({ summary: "Consultation", startTime: new Date("2030-01-01T10:00:00Z"), durationMinutes: 30 })).resolves.toBe("https://teams.example/meeting");
    const body = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(body.start).toEqual({ dateTime: "2030-01-01T10:00:00.000Z", timeZone: "UTC" });
    expect(body.end.dateTime).toBe("2030-01-01T10:30:00.000Z");
    expect(body.onlineMeetingProvider).toBe("teamsForBusiness");
  });
});
