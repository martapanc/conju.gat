/**
 * One line, same hairline-and-space language as the rest of the page.
 * No card, no background — it's a line under the content, not a block.
 */
export default function Footer() {
  return (
    <footer className="site-footer">
      <p>
        Fet per{" "}
        <a href="https://martacodes.it" target="_blank" rel="noreferrer">
          Marta
        </a>{" "}
        ·{" "}
        <a
          href="https://github.com/martapanc/conju.gat"
          target="_blank"
          rel="noreferrer"
        >
          codi al GitHub
        </a>
      </p>
    </footer>
  );
}
