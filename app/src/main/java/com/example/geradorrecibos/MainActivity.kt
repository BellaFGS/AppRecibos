package com.example.geradorrecibos

import android.Manifest
import android.app.DatePickerDialog
import android.content.ContentValues
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.geradorrecibos.databinding.ActivityMainBinding
import com.example.geradorrecibos.databinding.LayoutReciboBinding
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (!isGranted) {
            Toast.makeText(this, getString(R.string.permissao_negada), Toast.LENGTH_SHORT).show()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        setupListeners()
    }
    
    private fun setupUI() {
        // Configurar data atual
        binding.etDataPagamento.setText(dateFormat.format(Date()))
        
        // Configurar listener para valor
        binding.etValor.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                updateValorExtenso()
            }
        })
    }
    
    private fun setupListeners() {
        binding.etDataPagamento.setOnClickListener {
            showDatePicker()
        }
        
        binding.btnGerarRecibo.setOnClickListener {
            if (validateFields()) {
                showReciboDialog()
            }
        }
    }
    
    private fun showDatePicker() {
        val calendar = Calendar.getInstance()
        val datePickerDialog = DatePickerDialog(
            this,
            { _, year, month, dayOfMonth ->
                calendar.set(year, month, dayOfMonth)
                binding.etDataPagamento.setText(dateFormat.format(calendar.time))
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        )
        datePickerDialog.show()
    }
    
    private fun updateValorExtenso() {
        val valorText = binding.etValor.text.toString()
        if (valorText.isNotEmpty()) {
            try {
                val valorStr = binding.etValor.text.toString()
                val valor = valorStr.toDoubleOrNull()
                if (valor == null) {
                    Toast.makeText(this, "Informe um valor válido", Toast.LENGTH_SHORT).show()
                    return
                }

                val valorExtenso = NumeroExtenso.numeroParaExtenso(valor)
                binding.tvValorExtenso.text = "Por extenso: $valorExtenso"
                binding.tvValorExtenso.visibility = View.VISIBLE
            } catch (e: NumberFormatException) {
                binding.tvValorExtenso.visibility = View.GONE
            }
        } else {
            binding.tvValorExtenso.visibility = View.GONE
        }
    }

    private fun validateFields(): Boolean {
        val nomeCliente = binding.etNomeCliente.text.toString().trim()
        val documentoCliente = binding.etDocumentoCliente.text.toString().trim()
        val valorStr = binding.etValor.text.toString().trim()
        val servicoProposto = binding.etServicoProposto.text.toString().trim()

        if (nomeCliente.isEmpty() || documentoCliente.isEmpty() ||
            valorStr.isEmpty() || servicoProposto.isEmpty()
        ) {
            Toast.makeText(this, getString(R.string.campos_obrigatorios), Toast.LENGTH_SHORT).show()
            return false
        }

        val valor = valorStr.toDoubleOrNull()
        if (valor == null) {
            Toast.makeText(this, "Valor inválido", Toast.LENGTH_SHORT).show()
            return false
        }

        // 🚨 Validação de valor máximo
        val valorMaximo = 999_999_999.99
        if (valor > valorMaximo) {
            Toast.makeText(this, "Valor excede o limite permitido (R$ 999.999.999,99)", Toast.LENGTH_LONG).show()
            return false
        }

        return true
    }


    private fun showReciboDialog() {
        val dialogBinding = LayoutReciboBinding.inflate(LayoutInflater.from(this))
        
        // Preencher dados do recibo
        fillReciboData(dialogBinding)
        
        val dialog = AlertDialog.Builder(this)
            .setView(dialogBinding.root)
            .setPositiveButton("Salvar PDF") { _, _ ->
                checkPermissionAndSavePDF(dialogBinding.root)
            }
            .setNegativeButton("Salvar JPEG") { _, _ ->
                checkPermissionAndSaveJPEG(dialogBinding.root)
            }
            .setNeutralButton("Voltar", null)
            .create()
        
        dialog.show()
    }

    private fun fillReciboData(dialogBinding: LayoutReciboBinding) {
        try {
            val nomeEmpresa = binding.etNomeEmpresa.text.toString()
            val nomeResponsavel = binding.etNomeResponsavel.text.toString()
            val documentoResponsavel = binding.etDocumentoResponsavel.text.toString()
            val nomeCliente = binding.etNomeCliente.text.toString()
            val documentoCliente = binding.etDocumentoCliente.text.toString()
            val valorStr = binding.etValor.text.toString().trim()
            val servicoProposto = binding.etServicoProposto.text.toString()
            val dataPagamento = binding.etDataPagamento.text.toString()
            val docResponsavelMascara = aplicarMascaraDocumento(documentoResponsavel)   //Mascara de documento do responsável
            val docClienteMascara = aplicarMascaraDocumento(documentoCliente)           //Mascara de documento do responsável
            val currencyFormatBR = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
            val dataPagamentoFormatada = aplicarMascaraData(dataPagamento)

            val valor = valorStr.toDoubleOrNull()
            if (valor == null) {
                Toast.makeText(this, "Informe um valor válido", Toast.LENGTH_SHORT).show()
                return
            }

            dialogBinding.apply {
                //EMPRESA
                tvEmpresaRecibo.text = "Empresa: ${nomeEmpresa.caixaAlta()}"
                tvResponsavelRecibo.text = "Responsável: ${nomeResponsavel.caixaAlta()}"
                tvDocumentoResponsavelRecibo.text = "Documento: ${docResponsavelMascara}"
                tvNomeClienteRecibo.text = "Cliente: ${nomeCliente.caixaAlta()}"
                tvDocumentoClienteRecibo.text = "CPF/RG/CNPJ: ${docClienteMascara}"
                tvServicoRecibo.text = "Serviço: ${servicoProposto.caixaAlta()}"

                tvValorRecibo.text = "Valor: ${currencyFormatBR.format(valor)}"


                // Protege contra possíveis erros do NumeroExtenso
                val valorExtenso = try {
                    NumeroExtenso.numeroParaExtenso(valor)
                } catch (e: Exception) {
                    "ERRO AO CONVERTER VALOR POR EXTENSO!"
                }
                tvValorExtensoRecibo.text = "Valor por extenso: ${valorExtenso.caixaAlta()}"

                tvDataPagamentoRecibo.text = "Data do pagamento: $dataPagamentoFormatada"

                tvNomeResponsavelAssinatura.text = nomeResponsavel


                tvDataGeracao.text = "Recibo gerado em ${
                    SimpleDateFormat("dd/MM/yyyy 'às' HH:mm", Locale.getDefault()).format(Date())
                }"
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, "Erro ao gerar recibo!", Toast.LENGTH_SHORT).show()
        }
    }


    private fun checkPermissionAndSavePDF(view: View) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            savePDF(view)
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) 
                == PackageManager.PERMISSION_GRANTED) {
                savePDF(view)
            } else {
                requestPermissionLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        }
    }
    
    private fun checkPermissionAndSaveJPEG(view: View) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveJPEG(view)
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) 
                == PackageManager.PERMISSION_GRANTED) {
                saveJPEG(view)
            } else {
                requestPermissionLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        }
    }
    
    private fun savePDF(view: View) {
        try {
            val bitmap = createBitmapFromView(view)
            val pdfDocument = PdfDocument()
            val pageInfo = PdfDocument.PageInfo.Builder(bitmap.width, bitmap.height, 1).create()
            val page = pdfDocument.startPage(pageInfo)
            
            page.canvas.drawBitmap(bitmap, 0f, 0f, null)
            pdfDocument.finishPage(page)
            
            val fileName = "recibo-${binding.etNomeCliente.text.toString().replace(" ", "-")}.pdf"
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }
                
                val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                uri?.let {
                    contentResolver.openOutputStream(it)?.use { outputStream ->
                        pdfDocument.writeTo(outputStream)
                    }
                }
            } else {
                val file = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), fileName)
                FileOutputStream(file).use { outputStream ->
                    pdfDocument.writeTo(outputStream)
                }
            }
            
            pdfDocument.close()
            Toast.makeText(this, getString(R.string.arquivo_salvo), Toast.LENGTH_SHORT).show()
            
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, getString(R.string.erro_salvar), Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun saveJPEG(view: View) {
        try {
            val bitmap = createBitmapFromView(view)
            val fileName = "recibo-${binding.etNomeCliente.text.toString().replace(" ", "-")}.jpg"
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES)
                }
                
                val uri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
                uri?.let {
                    contentResolver.openOutputStream(it)?.use { outputStream ->
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 90, outputStream)
                    }
                }
            } else {
                val file = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), fileName)
                FileOutputStream(file).use { outputStream ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 90, outputStream)
                }
            }
            
            Toast.makeText(this, getString(R.string.arquivo_salvo), Toast.LENGTH_SHORT).show()
            
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, getString(R.string.erro_salvar), Toast.LENGTH_SHORT).show()
        }
    }

    private fun createBitmapFromView(view: View): Bitmap {
        // Força a medir o layout inteiro
        view.measure(
            View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
            View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
        )
        view.layout(0, 0, view.measuredWidth, view.measuredHeight)

        val bitmap = Bitmap.createBitmap(view.measuredWidth, view.measuredHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        view.draw(canvas)
        return bitmap
    }


    private fun String.caixaAlta(): String = this.uppercase(Locale("pt", "BR"))

    private fun aplicarMascaraDocumento(doc: String): String {
        val apenasNumeros = doc.filter { it.isDigit() }

        return when (apenasNumeros.length) {
            11 -> { // CPF
                apenasNumeros.replace(Regex("(\\d{3})(\\d{3})(\\d{3})(\\d{2})"),
                    "$1.$2.$3-$4")
            }
            14 -> { // CNPJ
                apenasNumeros.replace(Regex("(\\d{2})(\\d{3})(\\d{3})(\\d{4})(\\d{2})"),
                    "$1.$2.$3/$4-$5")
            }
            9 -> { // RG (formato comum)
                apenasNumeros.replace(Regex("(\\d{2})(\\d{3})(\\d{3})(\\d{1})"),
                    "$1.$2.$3-$4")
            }
            else -> apenasNumeros // sem máscara se não encaixar
        }
    }

    private fun aplicarMascaraData(data: String): String {
        val apenasNumeros = data.filter { it.isDigit() }
        return if (apenasNumeros.length == 8) {
            // Exemplo: 01022025 -> 01/02/2025
            apenasNumeros.replace(Regex("(\\d{2})(\\d{2})(\\d{4})"), "$1/$2/$3")
        } else {
            data // retorna como está se não for 8 dígitos
        }
    }



}

