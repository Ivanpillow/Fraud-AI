export default function Contact() {
  return (
    <section id="contacto" className="py-20 px-6 text-center bg-gray-900 text-white">
      <h2 className="text-3xl font-bold mb-4">Contacto</h2>
      <p className="text-gray-300">
        Hay que poner algo de contacto tmb<br/><br/>
        Escríbenos a:{" "}
        <a
          href="mailto:contacto@fraudai.com"
          className="text-indigo-400 underline"
        >
          hayquehaceruncorreo@si
        </a>
      </p>
    </section>
  );
}
