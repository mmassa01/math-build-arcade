# Browser review fixtures

These are developer-only test surfaces, not student pages. They exercise real game controls and can type known answers into test-origin practice. They are deliberately excluded from the public static distribution.

For a local Sites review, temporarily place the matching HTML and module pair at the root of dist, start the supported preview, and open review-qa.html. Remove those temporary copies before packaging. The review bench covers all ten games at desktop, phone, iPad and short-landscape sizes, and records actual DOM geometry. Keep all game-file writers paused during a sweep because live reload resets the bench.

The Type correct and Type wrong buttons parse rendered math and use the real numeric input. The power-shot capture watches the actual rally label. No hidden engine answers or direct score modifications are used. Never run scripted practice against a real student's browser save.

The typing fixture tests all ten actual pages through their input controls. Native GPU visual review remains a separate target-device check.
