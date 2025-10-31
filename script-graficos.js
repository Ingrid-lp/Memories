// Espera o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', () => {
  // Aqui estamos associando o clique do canvas ao gerar o gráfico
  const canvas = document.getElementById('meuGrafico');
  if (canvas) {
    canvas.addEventListener('click', gerarGrafico);
  }
});

const sentimentTypes = ['Felicidade', 'Amor', 'Raiva', 'Tristeza', 'Nostalgia'];

// Função para gerar o gráfico (já existente)
async function gerarGrafico() {
  const dados = await fetchSentimentCounts();  // Espera a contagem de sentimentos

  // Chama a função para gerar o gráfico com os dados passados
  grafico(sentimentTypes, dados);
}

function grafico(labels, dados) {
  const ctx = document.getElementById('meuGrafico').getContext('2d');

  new Chart(ctx, {
    type: 'bar',  // Tipo de gráfico (barra)
    data: {
      labels: labels,  // Labels dos itens no eixo X
      datasets: [{
        label: 'Valores',  // Nome da série de dados
        data: dados,  // Dados para o gráfico
        backgroundColor: 'rgba(54, 162, 235, 0.2)',  // Cor de fundo das barras
        borderColor: 'rgba(54, 162, 235, 1)',  // Cor da borda das barras
        borderWidth: 1  // Largura da borda
      }]
    },
    options: {
      responsive: true,  // Tornar o gráfico responsivo
      scales: {
        y: {
          beginAtZero: true  // Iniciar o eixo Y a partir de zero
        }
      }
    }
  });
}
const fetchSentimentCounts = async () => {
  try {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    console.log(loggedInUser);

    const response = await fetch(`http://localhost:3000/sentiments/${loggedInUser.id}`);
    const data = await response.json();

    // Definir todos os sentimentos possíveis
      // Adicione ou remova sentimentos conforme necessário

    // Criar um mapa para armazenar as contagens de sentimentos
    const sentimentCounts = data.reduce((acc, current) => {
      acc[current.sentiment] = Number(current.count);
      return acc;
    }, {});

    // Preencher as contagens para todos os sentimentos, caso algum não tenha sido encontrado
    const completeSentimentCounts = sentimentTypes.map(sentiment => {
      return sentimentCounts[sentiment] || 0;  // Se não existir, retorna 0
    });

    // Retorna as contagens completas
    return completeSentimentCounts;

  } catch (error) {
    console.error("Erro ao carregar contagens de sentimentos:", error);
    // Caso haja erro, retorna um array de 0s para todos os sentimentos
    return [0, 0, 0, 0, 0];  // Exemplo para 5 sentimentos
  }
};
