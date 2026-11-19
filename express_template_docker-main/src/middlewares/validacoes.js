function idValido(valor){
    const texto = String(valor);
    return /^\d+$/.test(texto) && Number.isSafeInteger(Number(texto)) && Number(texto) > 0;
}

function textoValido(valor, tamanho_maximo, tamanho_minimo = 1){
    return typeof valor === "string" && valor.trim().length >= tamanho_minimo && valor.trim().length <= tamanho_maximo;
}

function emailValido(email){
    return typeof email === "string" && email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function senhaValida(senha){
    return typeof senha === "string" && senha.length >= 8 && Buffer.byteLength(senha, "utf8") <= 72;
}

module.exports = { idValido, textoValido, emailValido, senhaValida };
