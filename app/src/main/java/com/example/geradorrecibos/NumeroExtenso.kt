package com.example.geradorrecibos

import java.util.Locale

object NumeroExtenso {
    
    private val unidades = arrayOf(
        "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"
    )
    
    private val dezenas = arrayOf(
        "", "", "vinte", "trinta", "quarenta", "cinquenta", 
        "sessenta", "setenta", "oitenta", "noventa"
    )
    
    private val especiais = arrayOf(
        "dez", "onze", "doze", "treze", "quatorze", "quinze", 
        "dezesseis", "dezessete", "dezoito", "dezenove"
    )
    
    private val centenas = arrayOf(
        "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
        "seiscentos", "setecentos", "oitocentos", "novecentos"
    )
    
    private fun converterCentena(numero: Int): String {
        if (numero == 0) return ""
        if (numero == 100) return "cem"
        
        var resultado = ""
        val c = numero / 100
        val d = (numero % 100) / 10
        val u = numero % 10
        
        if (c > 0) {
            resultado += centenas[c]
        }
        
        if (d == 1 && u > 0) {
            if (resultado.isNotEmpty()) resultado += " e "
            resultado += especiais[u]
        } else {
            if (d > 0) {
                if (resultado.isNotEmpty()) resultado += " e "
                resultado += dezenas[d]
            }
            if (u > 0) {
                if (resultado.isNotEmpty()) resultado += " e "
                resultado += unidades[u]
            }
        }
        
        return resultado
    }
    
    private fun converterGrupo(numero: Int, singular: String, plural: String): String {
        if (numero == 0) return ""
        
        val texto = converterCentena(numero)
        return if (numero == 1) {
            "$texto $singular"
        } else {
            "$texto $plural"
        }
    }

    fun numeroParaExtenso(valor: Double): String {
        if (valor == 0.0) return "zero reais"

        // Garante que sempre usa ponto como separador decimal
        val valorFormatado = String.format(Locale.US, "%.2f", valor)
        val partes = valorFormatado.split(".")
        val reais = partes[0].toInt()
        val centavos = partes[1].toInt()

        var resultado = ""

        if (reais == 0) {
            resultado = "zero reais"
        } else if (reais == 1) {
            resultado = "um real"
        } else {
            val milhoes = reais / 1_000_000
            val milhares = (reais % 1_000_000) / 1000
            val unidadesReais = reais % 1000

            var parteReais = ""

            if (milhoes > 0) {
                parteReais += converterGrupo(milhoes, "milhão", "milhões")
            }

            if (milhares > 0) {
                if (parteReais.isNotEmpty()) parteReais += " "
                parteReais += converterGrupo(milhares, "mil", "mil")
            }

            if (unidadesReais > 0) {
                if (parteReais.isNotEmpty()) {
                    if (milhoes > 0 || milhares > 0) {
                        parteReais += " e "
                    }
                }
                parteReais += converterCentena(unidadesReais)
            }

            resultado = "$parteReais ${if (reais == 1) "real" else "reais"}"
        }

        if (centavos > 0) {
            val textoCentavos = converterCentena(centavos)
            resultado += " e $textoCentavos ${if (centavos == 1) "centavo" else "centavos"}"
        }

        return resultado
    }

}

